import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'url'
import express from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

export async function createServer(
  root = process.cwd(),
  isProd = process.env.NODE_ENV === 'production',
  hmrPort
) {
  const resolve = (p) => path.resolve(__dirname, p)

  let vite = null
  if (!isProd) {
    vite = await (
      await import('vite')
    ).createServer({
      root,
      logLevel: 'info',
      server: {
        middlewareMode: true,
        hmr: {
          port: hmrPort
        }
      },
      appType: 'custom'
    })
    app.use(vite.middlewares)
  } else {
    app.use((await import('compression')).default())
    app.use(
      (await import('serve-static')).default(resolve('dist/client'), {
        index: false
      })
    )
  }

  app.use('*', async (req, res) => {
    const url = '/'
    let template, render
    if (!isProd && vite) {
      template = fs.readFileSync(resolve('index.html'), 'utf-8')
      template = await vite.transformIndexHtml(url, template) // Inserting react-refresh for local development
      render = (await vite.ssrLoadModule('/src/entry-server.tsx')).SSRRender
    } else {
      template = fs.readFileSync(resolve('dist/client/index.html'), 'utf-8')
      render = (await import('./dist/server/entry-server.js')).SSRRender
    }

    const appHtml = render(url) //Rendering component without any client side logic de-hydrated like a dry sponge
    const html = template.replace(`<!--app-html-->`, appHtml) //Replacing placeholder with SSR rendered components

    res.status(200).set({ 'Content-Type': 'text/html' }).end(html) //Outputing final html
  })

  return { app, vite }
}

createServer().then(({ app }) =>
  app.listen(5173, () => {
    console.log('http://localhost:5173')
  })
)
