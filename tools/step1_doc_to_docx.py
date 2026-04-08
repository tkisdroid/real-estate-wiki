"""Step 1: Word COM으로 모든 .doc → .docx 변환"""
import sys
from pathlib import Path
import win32com.client
import pythoncom

def main():
    laws_dir = Path(r"C:\Users\TG\Desktop\LLMproject\sources\laws")
    out_dir = laws_dir / "docling"
    out_dir.mkdir(exist_ok=True)

    doc_files = sorted(laws_dir.glob("*.doc"))
    print(f"DOC 파일 {len(doc_files)}개 변환 시작\n")

    pythoncom.CoInitialize()
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    word.DisplayAlerts = 0

    ok = 0
    for f in doc_files:
        docx_path = out_dir / (f.stem + ".docx")
        print(f"  {f.name}", end=" ... ", flush=True)
        try:
            doc = word.Documents.Open(str(f.resolve()))
            doc.SaveAs2(str(docx_path.resolve()), FileFormat=16)
            doc.Close(SaveChanges=0)
            print(f"OK ({docx_path.stat().st_size:,} bytes)")
            ok += 1
        except Exception as e:
            print(f"실패: {e}")

    word.Quit()
    pythoncom.CoUninitialize()
    print(f"\n완료: {ok}/{len(doc_files)}")

if __name__ == "__main__":
    main()
