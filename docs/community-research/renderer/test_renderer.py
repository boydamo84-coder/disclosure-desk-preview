"""Real Poppler and fresh RGB PNG QA with synthetic files only."""
import hashlib
import io
import json
import os
from pathlib import Path
import random
import socket
import sys
import tempfile

from PIL import Image, ImageDraw
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen.canvas import Canvas
import renderer


def fixture(path):
    """Fictional research, table, coloured raster chart and rotated layout."""
    c = Canvas(str(path), pagesize=(612, 792), pageCompression=1)
    c.setTitle("Fictional QA document PRIVATE_METADATA_MARKER")
    c.setAuthor("PRIVATE_AUTHOR_MARKER")
    c.setFillColor(HexColor('#17344b')); c.rect(0, 710, 612, 82, stroke=0, fill=1)
    c.setFillColor(white); c.setFont('Helvetica-Bold', 24); c.drawString(45, 752, 'FICTIONAL RESEARCH REPORT')
    c.setFont('Helvetica', 11); c.drawString(45, 728, 'Disclosure Desk | Layout preservation test')
    c.setFillColor(black); c.setFont('Helvetica', 12); c.drawString(45, 680, 'This is synthetic evidence, not a real observation.')
    c.setFillColor(HexColor('#17818a')); c.rect(45, 600, 522, 33, stroke=0, fill=1)
    c.setFillColor(white); c.setFont('Helvetica-Bold', 12)
    for x, label in [(55,'Sample'),(240,'Duration'),(410,'Result')]: c.drawString(x,612,label)
    c.setFillColor(black); c.setFont('Helvetica',12)
    for row, values in enumerate([('A-01','24 seconds','Unresolved'),('B-02','12 seconds','Known object'),('C-03','6 seconds','Not enough data')]):
        y=600-(row+1)*34
        c.setFillColor(HexColor('#eff8fa') if row%2==0 else white); c.rect(45,y,522,34,stroke=0,fill=1)
        c.setFillColor(black)
        for x, value in zip([55,240,410],values): c.drawString(x,y+11,value)
    c.setStrokeColor(HexColor('#17344b')); c.setLineWidth(1)
    for y in [498,532,566,600,633]: c.line(45,y,567,y)
    for x in [45,225,395,567]: c.line(x,498,x,633)
    chart=Image.new('RGB',(320,180),'white'); draw=ImageDraw.Draw(chart)
    draw.rectangle((10,10,155,170),fill='#cf4040'); draw.rectangle((165,10,310,170),fill='#276ec2')
    c.drawImage(ImageReader(chart),90,230,width=432,height=243)
    c.setFont('Helvetica',11); c.drawString(90,210,'Figure 1. Synthetic colour reference panels.')
    c.setFont('Helvetica',10); c.drawString(45,70,'Fictional source example; links are inert in the derived pages.')
    c.linkURL('https://example.invalid/reference', (45,65,340,85), relative=0, thickness=2)
    c.showPage()
    c.setPageSize((792,612)); c.setFillColor(HexColor('#17344b')); c.rect(0,536,792,76, stroke=0,fill=1)
    c.setFillColor(white); c.setFont('Helvetica-Bold',24); c.drawString(45,568,'PAGE TWO | WIDE LAYOUT')
    c.setFillColor(HexColor('#1d8c4c')); c.rect(70,115,650,300,stroke=0,fill=1)
    c.setFillColor(white); c.setFont('Helvetica',22); c.drawString(100,355,'Second-page evidence panel')
    c.setFillColor(black); c.setFont('Helvetica',12); c.drawString(70,78,'Different aspect ratio and colours prove the second page was retained.')
    c.showPage(); c.save()


def noise_pdf(path):
    # A compressible source referencing one high-entropy image on two pages;
    # each is separately rendered. Original stays below the 5 MB source cap.
    c=Canvas(str(path),pagesize=(1000,1000),pageCompression=1)
    image=Image.frombytes('RGB',(1000,1000),random.Random(906).randbytes(3_000_000))
    image=ImageReader(image)
    for _ in range(2):
        c.drawImage(image,0,0,1000,1000); c.showPage()
    c.save()


def receipt(path, count):
    raw=path.read_bytes()
    return {'status':'scan_passed_next_gate_only','sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'pages':count}


def check_pixel(image, pdf_x, pdf_y, pdf_size, color, tolerance=12):
    x=round(pdf_x / pdf_size[0] * (image.width-1)); y=round((1-pdf_y/pdf_size[1])*(image.height-1))
    assert all(abs(a-b)<=tolerance for a,b in zip(image.getpixel((x,y)),color)), (image.getpixel((x,y)), color, x,y)


def main():
    if '--container' in sys.argv:
        assert os.getuid()!=0 and {n for _,n in socket.if_nameindex()}=={'lo'}
        assert not os.access('/renderer',os.W_OK)
        print('PASS isolated non-root, read-only, network-disabled renderer',flush=True)
    with tempfile.TemporaryDirectory(prefix='dd-render-qa-') as tmp:
        source=Path(tmp)/'fictional.pdf'; fixture(source)
        original=source.read_bytes(); scan=receipt(source,2)
        res=renderer.render_candidate(source,scan)
        assert res['status']=='render_candidate_next_gate_only', res if 'files' not in res else res['status']
        files=res['files']; metadata=files['manifest.json']; manifest=json.loads(metadata)
        assert set(files)=={'manifest.json','page-001.png','page-002.png'}
        assert manifest['source_sha256']==scan['sha256'] and manifest['page_count']==2
        assert hashlib.sha256(metadata).hexdigest()==res['manifest_sha256']
        assert res['candidate_bytes']==sum(map(len,files.values()))<=5_000_000
        for page in manifest['pages']:
            png=files[page['file']]
            assert page['bytes']==len(png) and page['sha256']==hashlib.sha256(png).hexdigest()
            assert b'PRIVATE_AUTHOR_MARKER' not in png and b'PRIVATE_METADATA_MARKER' not in png and b'example.invalid' not in png
            renderer.validate_png(png,page['width'],page['height'])
        assert b'PRIVATE_AUTHOR_MARKER' not in metadata and b'PRIVATE_METADATA_MARKER' not in metadata
        a=Image.open(io.BytesIO(files['page-001.png'])); a.load()
        b=Image.open(io.BytesIO(files['page-002.png'])); b.load()
        assert a.mode==b.mode=='RGB' and a.height==b.width==2000
        assert a.width<a.height and b.width>b.height
        check_pixel(a,55,620,(612,792),(23,129,138)) # table header
        check_pixel(a,225,550,(612,792),(23,52,75),35) # grid line
        check_pixel(a,150,430,(612,792),(207,64,64)) # red image
        check_pixel(a,430,430,(612,792),(39,110,194)) # blue image
        check_pixel(b,450,200,(792,612),(29,140,76)) # wide second page
        assert source.read_bytes()==original
        print(f'PASS real Poppler: complete portrait/landscape pages, table grid and image pixels; {res["candidate_bytes"]} bytes; immutable original',flush=True)
        print('PASS generated PNG critical chunks only, ordered digest manifest, source metadata and annotation URL excluded',flush=True)
        if len(sys.argv)==3 and sys.argv[1]=='--visual-output':
            location=Path(sys.argv[2]); location.mkdir(parents=True,exist_ok=True)
            for name in ['page-001.png','page-002.png']: (location/name).write_bytes(files[name])
        def blocked(path, r, reason=None):
            x=renderer.render_candidate(path,r)
            assert x['status']=='blocked' and set(x)=={'status','reason'}, x if 'files' not in x else x['status']
            if reason is not None: assert x['reason']==reason,x
        for wrong in [None,{},dict(scan,status='blocked'),dict(scan,sha256='0'*64),dict(scan,bytes=21),dict(scan,pages=101),dict(scan,pages=True),dict(scan,extra='bad')]: blocked(source,wrong)
        blocked(source,dict(scan,pages=1),'page_count_mismatch')
        blocked(source,dict(scan,pages=3),'page_count_mismatch')
        changed=Path(tmp)/'changed.pdf'; changed.write_bytes(original+b'\n')
        blocked(changed,scan,'source_receipt_mismatch')
        invalid=Path(tmp)/'invalid.pdf'; invalid.write_bytes(b'Not a valid PDF document')
        blocked(invalid,receipt(invalid,1),'renderer_warning_or_error')
        symlink=Path(tmp)/'symlink.pdf'; symlink.symlink_to(source); blocked(symlink,scan)
        fifo=Path(tmp)/'fifo'; os.mkfifo(fifo); blocked(fifo,scan)
        print('PASS missing/blocked/malformed receipt, wrong digest/size/page count, changed bytes, malformed source, symlink and FIFO blocked',flush=True)
        high=Path(tmp)/'many-colours.pdf'; noise_pdf(high)
        assert high.stat().st_size<=5_000_000, high.stat().st_size
        blocked(high,receipt(high,2),'candidate_byte_limit')
        print('PASS genuine oversized derived pages refused under 5 MB combined cap, no partial result',flush=True)
        assert not list(Path('/tmp').glob('dd-render-*')) or all(p.name.startswith('dd-render-qa-') for p in Path('/tmp').glob('dd-render-*'))
        print('PASS private staging copies removed',flush=True)

if __name__=='__main__': main()
