import { writeFileSync } from 'fs';

  function defineAst(outputDir: string, baseName: string, types: Array<string>, imports) {
    const path: string = `${outputDir}/${baseName.toLocaleLowerCase()}.ts`;
    let content = imports.endsWith(';') ? `${imports}\n\n` : `${imports};\n\n`;

    content = defineVisitor(content, baseName, types);

    content +=  'export interface ExprConstructor {\n';
    content +=  '  new(...args: Array<any>): Expr\n';
    content+=   '}\n\n';

    content += `abstract class ${baseName} {\n`;


    for (const type of types) {
      const className = type.split(' : ')[0].trim();
      const fields = type.split(' : ')[1].trim();
      content = defineType(content, baseName, className, fields)
    }

    content += '// @ts-ignore\n';

    content += '  public accept(visitor: Visitor): string {\n';
    for (const type of types) {
      const typeName = type.split(':')[0].trim();
      content += `   if (this instanceof ${baseName}.${typeName}) return visitor.visit${typeName}${baseName}(this);\n`;
    }
    content += '  }\n';
    content += '}\n\n';

    content += 'export { Visitor }\n';
    content += `export default ${baseName};\n`;

    writeFileSync(path, content);
  }

  function defineType(content, baseName: string, className: string, fieldList: string) {
    const fields = fieldList.split(',');
    content += `  static ${className} = class extends ${baseName} {\n`;
    let constructorArgs = '';
    for (const field of fields) {
      const name = field.trim().split(' ')[1];
      const type = field.trim().split(' ')[0];
      constructorArgs += `public ${name}: ${type}, `;
    }
    constructorArgs = constructorArgs.trim().slice(0, -1);

    content += `    constructor(${constructorArgs}) {\n`;
    content += '      super();\n';
    content += '    }\n';
    content += '  };\n';

    return content;
  }

  function defineVisitor(content, baseName, types) {
    content += 'abstract class Visitor {\n';

    for (const type of types) {
      const typeName = type.split(':')[0].trim();
      content += `  public abstract visit${typeName}${baseName}(${baseName.toLowerCase()}: InstanceType<typeof ${baseName}.${typeName}>): string;\n`;
    }

    content += '}\n\n';

    return content;
  }

  (function main () {
    const args = process.argv.slice(2);
    if(args.length !== 1) {
      console.error('Error. Correct usage: ts-node generate-ast <outputdir>');
      process.exit(1);
    }

    const outputDir = args[0];

    defineAst(
      outputDir,
      "Expr",
      [
        'Binary   : Expr left, Token operator, Expr right',
        'Grouping : Expr expression',
        'Literal  : Object value',
        'Unary    : Token operator, Expr right',
      ],
      "import { Token, LoxLiteral } from '../../token';");
  })();


