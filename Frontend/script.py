import zipfile
import xml.etree.ElementTree as ET

with open('output.txt', 'w', encoding='utf-8') as f:
    def read_docx(filepath):
        f.write("--- DOCX ---\n")
        try:
            with zipfile.ZipFile(filepath, "r") as doc_zip:
                doc = doc_zip.read('word/document.xml')
                root = ET.fromstring(doc)
                namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
                for p in root.findall('.//w:p', namespaces):
                    p_text = ''.join([t.text for t in p.findall('.//w:t', namespaces) if t.text])
                    if p_text:
                        f.write(p_text + "\n")
        except Exception as e:
            f.write(f"Word Error: {str(e)}\n")

    def read_ods(filepath):
        f.write("\n--- ODS ---\n")
        try:
            with zipfile.ZipFile(filepath, "r") as ods_zip:
                content = ods_zip.read('content.xml')
                root = ET.fromstring(content)
                ns = {
                    'text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0',
                    'table': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0'
                }
                for table in root.findall('.//table:table', ns):
                    f.write(f"\nTable: {table.attrib.get('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}name', 'Unknown')}\n")
                    for row in table.findall('.//table:table-row', ns):
                        row_data = []
                        for cell in row.findall('.//table:table-cell', ns):
                            cell_texts = [p.text for p in cell.findall('.//text:p', ns) if p.text]
                            row_data.append(" ".join(cell_texts))
                        if any(row_data):
                            f.write(" | ".join(row_data) + "\n")
        except Exception as e:
            f.write(f"ODS Error: {str(e)}\n")

    read_docx(r"D:\NexusMicro\DOC's\cotización Los Fresnitos.docx")
    read_ods(r"D:\NexusMicro\DOC's\confecciones JULIO.ods")
