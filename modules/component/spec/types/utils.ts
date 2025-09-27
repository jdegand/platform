import { describe, test } from 'tstyche';

export function potentialObservableTest(
  snippetFactory: (potentialObservableType: string) => string
) {
  if (!snippetFactory('').includes('const value')) {
    throw new Error('Snippet must include a constant named `value`!');
  }

  return (
    potentialObservableType: string,
    expectedType: string,
    typeDefinition = ''
  ) => {
    describe(`potentialObservableType: ${potentialObservableType}`, () => {
      test(`should infer value as ${expectedType}`, () => {
        // TSTyche will pick up this comment for type assertion
        console.log(`
          ${typeDefinition}
          ${snippetFactory(potentialObservableType)}
          //    ^? ${expectedType}
        `);
      });
    });
  };
}
