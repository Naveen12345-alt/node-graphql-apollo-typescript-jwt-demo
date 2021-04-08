cd server
nodemon --exec ts-node src/index.ts &
cd ../web
npm start &