#!/usr/bin/env python3
"""Import the legacy Member WP workbook into the Member WP app.

Security properties:
- Uses Python standard library only.
- Reads XLSX directly from ZIP/XML.
- Does not write plaintext credential exports to disk.
- Sends credentials only inside the authenticated import request.
- --dry-run prints counts and duplicate groups, never secret values.
"""
from __future__ import annotations
import argparse, hashlib, json, os, re, sys, urllib.request, urllib.error, zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS_PKG = "http://schemas.openxmlformats.org/package/2006/relationships"


def clean(v):
    if v is None: return None
    s = str(v).strip()
    return s if s else None

def digits(v):
    s = clean(v)
    return re.sub(r"\D", "", s) if s else None

def col_index(ref: str) -> int:
    m = re.match(r"([A-Z]+)", ref)
    n = 0
    for ch in m.group(1): n = n * 26 + (ord(ch) - 64)
    return n - 1

def norm_name(v):
    return re.sub(r"\s+", " ", (clean(v) or "")).strip().upper()

def split_docs(v):
    s = clean(v)
    if not s: return []
    out=[]
    for p in re.split(r"\s*\+\s*|,", s):
        p=clean(p)
        if p and p not in out: out.append(p)
    return out

class XlsxReader:
    def __init__(self, path: Path):
        self.z = zipfile.ZipFile(path)
        self.shared = self._shared_strings()
        self.sheets = self._sheet_map()

    def _shared_strings(self):
        try: root=ET.fromstring(self.z.read("xl/sharedStrings.xml"))
        except KeyError: return []
        vals=[]
        for si in root.findall(f"{{{NS_MAIN}}}si"):
            vals.append("".join(t.text or "" for t in si.iter(f"{{{NS_MAIN}}}t")))
        return vals

    def _sheet_map(self):
        wb=ET.fromstring(self.z.read("xl/workbook.xml"))
        relroot=ET.fromstring(self.z.read("xl/_rels/workbook.xml.rels"))
        rels={r.attrib["Id"]:r.attrib["Target"] for r in relroot.findall(f"{{{NS_PKG}}}Relationship")}
        out={}
        for sh in wb.find(f"{{{NS_MAIN}}}sheets"):
            name=sh.attrib["name"]; rid=sh.attrib[f"{{{NS_REL}}}id"]
            target=rels[rid].lstrip("/")
            if not target.startswith("xl/"): target="xl/"+target
            out[name]=target
        return out

    def rows(self, sheet_name):
        root=ET.fromstring(self.z.read(self.sheets[sheet_name]))
        data=root.find(f"{{{NS_MAIN}}}sheetData")
        result=[]
        for row in data.findall(f"{{{NS_MAIN}}}row"):
            vals={}
            for c in row.findall(f"{{{NS_MAIN}}}c"):
                ref=c.attrib.get("r", "A1"); idx=col_index(ref); typ=c.attrib.get("t")
                value=None
                if typ=="inlineStr":
                    isel=c.find(f"{{{NS_MAIN}}}is")
                    if isel is not None: value="".join(t.text or "" for t in isel.iter(f"{{{NS_MAIN}}}t"))
                else:
                    v=c.find(f"{{{NS_MAIN}}}v")
                    if v is not None:
                        raw=v.text or ""
                        if typ=="s":
                            try: value=self.shared[int(raw)]
                            except: value=raw
                        elif typ=="b": value=(raw=="1")
                        else: value=raw
                vals[idx]=value
            max_idx=max(vals.keys(),default=-1)
            arr=[None]*(max_idx+1)
            for i,v in vals.items(): arr[i]=v
            result.append((int(row.attrib.get("r","0")),arr))
        return result


def cell(row, idx):
    return row[idx] if idx < len(row) else None

def secret(kind,label,val):
    v=clean(val)
    return {"kind":kind,"label":label,"secret":v} if v else None

def contact(kind,val,primary=False):
    v=clean(val)
    return {"contact_type":kind,"value":v,"is_primary":primary} if v else None


def build_payload(path: Path):
    r=XlsxReader(path)
    taxpayers=[]; issues=[]; filings=[]

    for rownum,row in r.rows("BADAN"):
        if rownum < 4 or not clean(cell(row,1)): continue
        contacts=[x for x in [contact("email_primary",cell(row,7),True),contact("phone",cell(row,10)),contact("email_registered",cell(row,11))] if x]
        credentials=[x for x in [
            secret("coretax_key","Coretax Key",cell(row,4)),secret("coretax_passphrase","Coretax Passphrase",cell(row,5)),
            secret("efin","EFIN",cell(row,6)),secret("email_password","Primary Email Password",cell(row,8)),
            secret("djp_key","DJP Key",cell(row,9)),secret("registered_email_password","Registered Email Password",cell(row,12))
        ] if x]
        taxpayers.append({"source_sheet":"BADAN","source_row":rownum,"taxpayer_type":"BADAN","name":clean(cell(row,1)),"npwp":digits(cell(row,2)),"npwp16":digits(cell(row,3)),"nik":None,"kk":None,"notes":None,"contacts":contacts,"credentials":credentials})

    for rownum,row in r.rows("OP"):
        if rownum < 4 or not clean(cell(row,1)): continue
        contacts=[x for x in [contact("email_primary",cell(row,8),True),contact("email_alt",cell(row,10)),contact("phone",cell(row,12))] if x]
        credentials=[x for x in [
            secret("coretax_key","Coretax Key",cell(row,4)),secret("coretax_passphrase","Coretax Passphrase",cell(row,5)),
            secret("efin","EFIN",cell(row,6)),secret("djp_key","DJP Key",cell(row,7)),
            secret("email_password","Primary Email Password",cell(row,9)),secret("alternate_email_password","Alternate Email Password",cell(row,11)),
            secret("npwp_el_registration_key","NPWP-el Registration Key",cell(row,13))
        ] if x]
        taxpayers.append({"source_sheet":"OP","source_row":rownum,"taxpayer_type":"OP","name":clean(cell(row,1)),"npwp":digits(cell(row,2)),"npwp16":digits(cell(row,3)),"nik":digits(cell(row,14)),"kk":digits(cell(row,15)),"notes":None,"contacts":contacts,"credentials":credentials})

    for rownum,row in r.rows("BADAN 2"):
        if rownum < 4 or not clean(cell(row,1)): continue
        issues.append({"source_sheet":"BADAN 2","source_row":rownum,"taxpayer_name":clean(cell(row,1)),"title":clean(cell(row,3)) or "Kendala akses / administrasi", "description":f"Direktur: {clean(cell(row,2))}" if clean(cell(row,2)) else None,"required_documents":split_docs(cell(row,4))})

    for rownum,row in r.rows("OP 2"):
        if rownum < 4 or not clean(cell(row,1)): continue
        issues.append({"source_sheet":"OP 2","source_row":rownum,"taxpayer_name":clean(cell(row,1)),"title":clean(cell(row,2)) or "Dokumen akses Coretax / identitas belum lengkap","description":None,"required_documents":split_docs(cell(row,3))})

    months={3:4,4:5,5:6,6:7,7:8,8:9,9:10,10:11,11:12}
    for rownum,row in r.rows("Sheet1"):
        if rownum < 4 or not clean(cell(row,1)): continue
        name=clean(cell(row,1)); npwp=digits(cell(row,2))
        for col,month in months.items():
            raw=clean(cell(row,col)); status="filed" if raw and raw.lower() not in {"-","belum","x"} else "not_started"
            filings.append({"taxpayer_name":name,"npwp":npwp,"tax_type":"E-Filing","period_month":month,"period_year":2018,"status":status})

    by_npwp={}
    for t in taxpayers:
        if t["npwp"]: by_npwp.setdefault(t["npwp"],[]).append(f"{t['source_sheet']}:{t['source_row']}")
    duplicates=[{"npwp":k,"sources":v} for k,v in by_npwp.items() if len(v)>1]

    body=path.read_bytes(); sha=hashlib.sha256(body).hexdigest()
    summary={
        "source_taxpayers":len(taxpayers),"badan":sum(t["taxpayer_type"]=="BADAN" for t in taxpayers),"op":sum(t["taxpayer_type"]=="OP" for t in taxpayers),
        "issues":len(issues),"filing_tasks_source":len(filings),"duplicate_npwp_groups":len(duplicates),
        "credential_values":sum(len(t["credentials"]) for t in taxpayers),"contacts":sum(len(t["contacts"]) for t in taxpayers)
    }
    return {"file_name":path.name,"source_hash":sha,"taxpayers":taxpayers,"issues":issues,"filings":filings,"duplicates":duplicates,"summary":summary}


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("xlsx",type=Path)
    ap.add_argument("--url",default=os.environ.get("MEMBER_WP_APP_URL","http://localhost:3000"))
    ap.add_argument("--token",default=os.environ.get("MEMBER_WP_IMPORT_TOKEN"))
    ap.add_argument("--dry-run",action="store_true")
    ap.add_argument("--allow-http",action="store_true",help="Allow non-localhost HTTP target")
    args=ap.parse_args()
    if not args.xlsx.exists(): ap.error(f"File not found: {args.xlsx}")
    payload=build_payload(args.xlsx)
    print("Member WP import audit")
    print(json.dumps(payload["summary"],indent=2,ensure_ascii=False))
    if payload["duplicates"]:
        print("Duplicate NPWP groups (values shown for data-quality review):")
        for d in payload["duplicates"]: print(f"- {d['npwp']}: {', '.join(d['sources'])}")
    if args.dry_run: return 0
    if not args.token: ap.error("Import token required via --token or MEMBER_WP_IMPORT_TOKEN")
    target=args.url.rstrip("/")+"/api/admin/import"
    if target.startswith("http://") and not re.match(r"http://(localhost|127\.0\.0\.1)(:|/)",target) and not args.allow_http:
        ap.error("Refusing to send credentials over remote HTTP. Use HTTPS or --allow-http only if you understand the risk.")
    data=json.dumps(payload,ensure_ascii=False).encode("utf-8")
    req=urllib.request.Request(target,data=data,method="POST",headers={"content-type":"application/json","x-member-wp-import-token":args.token})
    try:
        with urllib.request.urlopen(req,timeout=180) as resp:
            result=json.loads(resp.read().decode("utf-8")); print("Import complete:"); print(json.dumps(result,indent=2,ensure_ascii=False))
    except urllib.error.HTTPError as e:
        detail=e.read().decode("utf-8",errors="replace"); print(f"Import failed HTTP {e.code}: {detail}",file=sys.stderr); return 1
    return 0

if __name__=="__main__": raise SystemExit(main())
