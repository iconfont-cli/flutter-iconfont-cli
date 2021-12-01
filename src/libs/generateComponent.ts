import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import glob from 'glob';
import colors from 'colors';
import { snakeCase } from 'lodash';
import { XmlData } from 'iconfont-parser';
import { Config } from './getConfig';
import { getTemplate } from './getTemplate';
import {
  replaceCases,
  replaceConvertCases,
  replaceNames,
  replaceSize,
} from './replace';
import { whitespace } from './whitespace';

const ATTRIBUTE_FILL_MAP = ['path'];

export const generateComponent = (data: XmlData, config: Config) => {
  const names: string[] = [];
  const saveDir = path.resolve(config.save_dir);
  let cases: string = '';
  let stringToEnumCases = '';

  mkdirp.sync(saveDir);
  glob.sync(path.join(saveDir, '*')).forEach((file) => fs.unlinkSync(file));

  data.svg.symbol.forEach((item) => {
    const iconId = item.$.id;
    let iconIdAfterTrim = snakeCase(config.trim_icon_prefix
      ? iconId.replace(new RegExp(`^${config.trim_icon_prefix}(.+?)$`), '$1')
      : iconId);

    // dart enum doesn't support keyword with digit prefix
    if (/^\d/.test(iconIdAfterTrim)) {
      iconIdAfterTrim = '_' + iconIdAfterTrim;
    }

    names.push(iconIdAfterTrim);

    cases += `${whitespace(6)}case IconNames.${iconIdAfterTrim}:\n`;
    cases += `${whitespace(8)}svgXml = '''${generateCase(item, 10)}${whitespace(8)}''';\n`;
    cases += `${whitespace(8)}break;\n`;

    stringToEnumCases += `${whitespace(6)}case '${iconIdAfterTrim}':\n`;
    stringToEnumCases += `${whitespace(8)}iconName = IconNames.${iconIdAfterTrim};\n`;
    stringToEnumCases += `${whitespace(8)}break;\n`;
  });

  let iconFile =  getTemplate(config.null_safety ? 'Icon.null.safety.dart' : 'Icon.dart');

  iconFile = replaceSize(iconFile, config.default_icon_size);
  iconFile = replaceCases(iconFile, cases);
  iconFile = replaceConvertCases(iconFile, stringToEnumCases);
  iconFile = replaceNames(iconFile, names);

  fs.writeFileSync(path.join(saveDir, 'icon_font.dart'), iconFile);

  console.log(`\n${colors.green('√')} All icons have putted into dir: ${colors.green(config.save_dir)}\n`);
};

const generateCase = (data: XmlData['svg']['symbol'][number], baseIdent: number) => {
  let template = `\n${whitespace(baseIdent)}<svg viewBox="${data.$.viewBox}" xmlns="http://www.w3.org/2000/svg">\n`;

  for (const domName of Object.keys(data)) {
    if (domName === '$') {
      continue;
    }

    if (!domName) {
      console.error(colors.red(`Unable to transform dom "${domName}"`));
      process.exit(1);
    }

    const counter = {
      colorIndex: 0,
      baseIdent,
    };

    if (data[domName].$) {
      template += `${whitespace(baseIdent + 2)}<${domName}${addAttribute(domName, data[domName], counter)}\n${whitespace(baseIdent + 2)}/>\n`;
    } else if (Array.isArray(data[domName])) {
      data[domName].forEach((sub) => {
        template += `${whitespace(baseIdent + 2)}<${domName}${addAttribute(domName, sub, counter)}\n${whitespace(baseIdent + 2)}/>\n`;
      });
    }
  }

  template += `${whitespace(baseIdent)}</svg>\n`;

  return template;
};

const addAttribute = (domName: string, sub: XmlData['svg']['symbol'][number]['path'][number], counter: { colorIndex: number, baseIdent: number }) => {
  let template = '';

  if (sub && sub.$) {
    if (ATTRIBUTE_FILL_MAP.includes(domName)) {
      // Set default color same as in iconfont.cn
      // And create placeholder to inject color by user's behavior
      sub.$.fill = sub.$.fill || '#333333';
      sub.$['fill-opacity'] = sub.$['fill-opacity'] || 1;
    }

    for (const attributeName of Object.keys(sub.$)) {
      if (attributeName === 'fill') {
        template += `\n${whitespace(counter.baseIdent + 4)}${attributeName}="''' + getColor(${counter.colorIndex}, color, colors, '${sub.$[attributeName]}') + '''"`;
        counter.colorIndex += 1;
      } else if (attributeName === 'fill-opacity') {
        template += `\n${whitespace(counter.baseIdent + 4)}${attributeName}=$opacity`;
      } else {
        template += `\n${whitespace(counter.baseIdent + 4)}${attributeName}="${sub.$[attributeName]}"`;
      }
    }
  }

  return template;
};
