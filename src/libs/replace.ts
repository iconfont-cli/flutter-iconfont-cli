export const replaceSize = (content: string, size: number) => {
  return content.replace(/#size#/g, String(size));
};

export const replaceCases = (content: string, cases: string) => {
  return content.replace(/#cases#/g, cases);
};

export const replaceNames = (content: string, names: string[]) => {
  return content.replace(/#names#/g, names.join(', '));
};

export const replaceSummaryIcon = (content: string, iconName: string) => {
  return content.replace(/#SummaryIcon#/g, iconName);
};
