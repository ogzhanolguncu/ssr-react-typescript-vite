import ReactDOMServer from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import { App } from './App'

export function SSRRender(url: string | Partial<Location>, context: any) {
  return ReactDOMServer.renderToString(
    //@ts-ignore
    <StaticRouter location={url} context={context}>
      <App />
    </StaticRouter>
  )
}
