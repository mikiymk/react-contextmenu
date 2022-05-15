import path from "path";
import { defineConfig } from "vite";


export default defineConfig({
    build:{
        lib:{
            entry: path.resolve(__dirname, 'src/index.ts'),
            name: 'solid-contextmenu',
            formats:["es", "cjs"],
        },
        rollupOptions: {
            // ライブラリにバンドルされるべきではない依存関係を
            // 外部化するようにします
            external: ['react', "react-dom"],
            output: {
              // 外部化された依存関係のために UMD のビルドで使用する
              // グローバル変数を提供します
              globals: {
                vue: 'Vue'
              }
            }
          }
    }
})