"""Create an exact, buildless comparison from immutable Git checkpoints."""
import hashlib
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
VERSIONS = (
    ('comparison-lab.html', 'b9befd1d6abe05d5e065c70eb53a72af12188f96', '350a0822d36a6a75c75fb39f81a538a9fd0525c100c925877dee5a6db383fec2'),
    ('storm-hammer.html', '063f6cc278a272c7256232067609dbac9fa0b1b1', '4a94a75552a250113bf2d8958e2861cd94ae6d803d81a27548205646c33363eb'),
    ('index.html', '5cc21e578a891bb01b8e92e8877baa2bc7e804c7', 'ba8f623bd3da9aa1bae1d2afe935f0291a6021f2008400503caf282e4c5591c6'),
    ('two-layer.html', '25e98d9dca3b7e6273c218a7b67ed9a6d0ae92f8', 'd5fe4ebd5d7f3172e864c18160652d9ff020ce8978c809d5d533a09a088e5f43'),
)

def main():
    output = ROOT / 'dist' / 'comparison'
    output.mkdir(parents=True, exist_ok=True)
    for filename, commit, expected in VERSIONS:
        content = subprocess.check_output(['git', '-C', str(ROOT), 'show', f'{commit}:index.html'])
        if hashlib.sha256(content).hexdigest() != expected:
            raise ValueError(f'Checkpoint hash mismatch: {filename}')
        (output / filename).write_bytes(content)
    storm=(ROOT/'index.html').read_bytes()
    if b'TN-D7-2026-10-24-maze-shapes-1' not in storm:
        raise ValueError('Assemble the Maze Shapes candidate before packaging')
    (output/'maze-shapes.html').write_bytes(storm)
    (output / 'compare.html').write_bytes((ROOT / 'web' / 'compare.html').read_bytes())
    print('Comparison packaged; all four prior game hashes verified.')

if __name__ == '__main__':
    main()
