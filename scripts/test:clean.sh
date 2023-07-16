DIR=$(realpath "$( cd "$( dirname "$0" )" && pwd -P )""/../")

rm -rf $DIR"/test/node_modules"
rm $DIR"/test/package-lock.json"

cd $DIR"/test"
npm install ../
