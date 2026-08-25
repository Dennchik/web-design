// vite/tasks/fontsStyle.js
import fs from 'fs';
import path from 'path';
import { paths } from '../config/path.js';

// 🔹 Функция генерации SCSS с @include font-face
function generateFontsScss() {
   const fontsDir = paths.fonts.src;
   const targetFile = paths.fonts.dest || 'src/scss/generated/_fonts.scss';

   // ✅ Всегда начинаем с чистого содержимого
   let content = '@use "variables" as *;\r\n@use "mixins" as *;\r\n';

   if (fs.existsSync(fontsDir)) {
      // ✅ Получаем все файлы в папке
      const items = fs.readdirSync(fontsDir);

      // ✅ Фильтруем только файлы шрифтов
      const fontFiles = items.filter((item) => {
         const ext = path.extname(item).toLowerCase();
         return ['.ttf', '.woff', '.woff2', '.otf', '.eot'].includes(ext);
      });

      // ✅ Используем Set для уникальных имен
      const processedFonts = new Set();
      fontFiles.forEach((item) => {
         // ✅ Берем имя файла без расширения
         const fontName = path.basename(item, path.extname(item));
         if (!processedFonts.has(fontName)) {
            processedFonts.add(fontName);
            content += `@include font-face("${fontName}", "${fontName}", 400, "normal");\r\n`;
         }
      });

      console.log(`📁 Найдено шрифтов: ${processedFonts.size}`);
   } else {
      console.warn(`⚠️ Директория шрифтов не найдена: ${fontsDir}`);
   }

   // ✅ Создаем директорию для файла, если её нет
   const targetDir = path.dirname(targetFile);
   if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
   }

   // ✅ Перезаписываем файл целиком
   fs.writeFileSync(targetFile, content);
   console.log(`✅ _fonts.scss сгенерирован: ${targetFile}`);
}

// 🔹 Плагин для Vite
export function fontStyle() {
   let timeoutId = null;

   return {
      name: 'fonts-style-plugin',
      buildStart() {
         generateFontsScss();
      },
      configureServer(server) {
         const fontsPath = paths.fonts.src;
         if (!fs.existsSync(fontsPath)) return;

         // ✅ Следим за изменениями в папке со шрифтами
         fs.watch(fontsPath, { persistent: true }, (_eventType, filename) => {
            if (!filename) return;

            // ✅ Дебаунс для предотвращения множественных вызовов
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
               console.log(`⚡ Изменение в файле: ${filename}`);
               console.log('🔄 Пересоздаём _fonts.scss...');
               generateFontsScss();
               server.ws.send({ type: 'full-reload' });
            }, 300);
         });
      },
   };
}
