"""Build the licensed display subset; requires fontTools and DejaVu Sans Bold."""
from pathlib import Path
import sys
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.transformPen import TransformPen

source = Path(sys.argv[1] if len(sys.argv) > 1 else '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')
output = Path(__file__).resolve().parents[2] / 'public/big-two/portrait/fonts/tekad-display-v2.woff'
font = TTFont(source)
options = subset.Options()
options.hinting = False
subsetter = subset.Subsetter(options=options)
subsetter.populate(unicodes=list(range(32, 256)) + [0x2192, 0x2013, 0x2014, 0x2026, 0x2264])
subsetter.subset(font)
glyphset = font.getGlyphSet()
glyphs = {}
# Flatten components before the transform. Otherwise accented letters would
# transform their component matrix AND the already transformed base glyph.
for name in font.getGlyphOrder():
    recording = DecomposingRecordingPen(glyphset)
    glyphset[name].draw(recording)
    pen = TTGlyphPen(None)
    recording.replay(TransformPen(pen, (.76, 0, .12, 1, 0, 0)))
    glyphs[name] = pen.glyph()
for name, glyph in glyphs.items():
    font['glyf'][name] = glyph
    glyph.recalcBounds(font['glyf'])
    advance, bearing = font['hmtx'][name]
    font['hmtx'][name] = (round(advance * .76), getattr(glyph, 'xMin', round(bearing * .76)))
values = {1:'Tekad Display', 2:'Bold Italic', 3:'Tekad Display Bold Italic 1.1', 4:'Tekad Display Bold Italic', 6:'TekadDisplay-BoldItalic', 16:'Tekad Display', 17:'Bold Italic'}
for record in font['name'].names:
    if record.nameID in values:
        record.string = values[record.nameID].encode(record.getEncoding())
font['OS/2'].usWidthClass = 3
font['OS/2'].fsSelection |= 1
font['head'].macStyle |= 2
font['post'].italicAngle = -7
font.flavor = 'woff'
font.save(output)
print(output.name, output.stat().st_size, 'bytes')
