import {h} from 'https://unpkg.com/preact@10.5.13/dist/preact.module.js'
import render from 'https://unpkg.com/preact-render-to-string@5.1.19/dist/index.module.js?module'

const app = <h1>Hello, world!</h1>
const html = render(app)

console.log('expected: %s', '<h1>Hello, world!</h1>')
console.log('actual: %s', html)
