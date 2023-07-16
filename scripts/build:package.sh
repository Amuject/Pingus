DIR=$(realpath "$( cd "$( dirname "$0" )" && pwd -P )""/../")

cat >dist-esm/package.json <<!EOF
{
    "type": "module"
}
!EOF
cat >dist-cjs/package.json <<!EOF
{
    "type": "commonjs"
}
!EOF

cd dist-esm
find . -name '*.d.ts' | cpio -pdm ../dist-cjs