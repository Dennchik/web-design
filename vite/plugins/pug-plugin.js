import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import pug from 'pug';

export function pugPlugin() {
	const pagesDir = resolve(process.cwd(), 'src/pug/pages');

	return {
		name: 'vite-plugin-pug-custom',

		configureServer(server) {
			server.middlewares.use(async (req, res, next) => {
				const url = req.url.split('?')[0];

				if (url === '/' || url.endsWith('.html') || !url.includes('.')) {
					const pageName = url === '/' ? 'index' : url.replace(/^\//, '').replace(/\.html$/, '');
					const pugFile = resolve(pagesDir, pageName + '.pug');

					if (existsSync(pugFile)) {
						try {
							let source = readFileSync(pugFile, 'utf-8');

							// Заменяем @/pug на правильный путь ОТНОСИТЕЛЬНО папки pages
							source = source.replace(/@\/pug\/layouts\//g, '../layouts/');
							source = source.replace(/@\/pug\/sections\//g, '../sections/');
							source = source.replace(/@\/pug\/components\//g, '../components/');
							source = source.replace(/@\/pug\//g, '../');
							source = source.replace(/@\//g, '../');

							const html = pug.render(source, {
								pretty: true,
								basedir: resolve(process.cwd(), 'src/pug'),
								filename: pugFile
							});
							res.setHeader('Content-Type', 'text/html');
							res.end(html);
							return;
						} catch (err) {
							console.error('❌ Pug error:', err.message);
							res.statusCode = 500;
							res.end(`<pre>${err.message}</pre>`);
							return;
						}
					}
				}
				next();
			});
		},

		transform(code, id) {
			if (id.endsWith('.pug')) {
				try {
					let source = code.replace(/@\/pug\/layouts\//g, '../layouts/');
					source = source.replace(/@\/pug\/sections\//g, '../sections/');
					source = source.replace(/@\/pug\/components\//g, '../components/');
					source = source.replace(/@\/pug\//g, '../');
					source = source.replace(/@\//g, '../');

					const html = pug.render(source, {
						pretty: true,
						basedir: resolve(process.cwd(), 'src/pug'),
						filename: id
					});
					return {
						code: `export default ${JSON.stringify(html)};`,
						map: null
					};
				} catch (err) {
					console.error('❌ Pug transform error:', err.message);
					throw err;
				}
			}
		}
	};
}