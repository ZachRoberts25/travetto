module.exports = {
  'package.json': {},
  'README.md': {},
  'resources/application.yml': {},
  'src/model/todo.ts': { requires: ['model'] },
  'src/rest/todo.ts': { requires: ['rest', 'model'] },
  'src/rest/auth.ts': { requires: ['rest', 'auth-rest'] },
  'src/rest/auth.config.ts': { requires: ['rest', 'auth-rest'] },
  'src/rest/primary.ts': { requires: ['rest'] },
  'src/rest/app.ts': { requires: ['rest'] },
  'test/config.ts': { requires: ['model', 'test'] },
  'test/model/todo.ts': { requires: ['model', 'test'] },
};