import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { Schema as StoreDevtoolsOptions } from './schema';
import {
  getTestProjectPath,
  createWorkspace,
} from '@ngrx/schematics-core/testing';

describe('Store-Devtools ng-add Schematic', () => {
  const schematicRunner = new SchematicTestRunner(
    '@ngrx/store-devtools',
    path.join(__dirname, '../collection.json')
  );
  const defaultOptions: StoreDevtoolsOptions = {
    skipPackageJson: false,
    project: 'bar',
    module: 'app-module',
  };

  const projectPath = getTestProjectPath();

  let appTree: UnitTestTree;

  beforeEach(async () => {
    appTree = await createWorkspace(schematicRunner, appTree);
  });

  it('should update package.json', async () => {
    const options = { ...defaultOptions };

    const tree = await schematicRunner.runSchematic('ng-add', options, appTree);
    const packageJson = JSON.parse(tree.readContent('/package.json'));

    expect(packageJson.dependencies['@ngrx/store-devtools']).toBeDefined();
  });

  it('should skip package.json update', async () => {
    const options = { ...defaultOptions, skipPackageJson: true };

    const tree = await schematicRunner.runSchematic('ng-add', options, appTree);
    const packageJson = JSON.parse(tree.readContent('/package.json'));

    expect(packageJson.dependencies['@ngrx/store-devtools']).toBeUndefined();
  });

  it('should be provided by default', async () => {
    const options = { ...defaultOptions };

    const tree = await schematicRunner.runSchematic('ng-add', options, appTree);
    const content = tree.readContent(`${projectPath}/src/app/app-module.ts`);
    expect(content).toMatch(
      /import { StoreDevtoolsModule } from '@ngrx\/store-devtools';/
    );
    expect(content).toMatch(
      /StoreDevtoolsModule.instrument\({ maxAge: 25, logOnly: !isDevMode\(\) }\)/
    );
  });

  it('should import into a specified module', async () => {
    const options = { ...defaultOptions };

    const tree = await schematicRunner.runSchematic('ng-add', options, appTree);
    const content = tree.readContent(`${projectPath}/src/app/app-module.ts`);
    expect(content).toMatch(
      /import { StoreDevtoolsModule } from '@ngrx\/store-devtools';/
    );
  });

  it('should import isDevMode correctly', async () => {
    const options = { ...defaultOptions, module: 'app-module.ts' };

    const tree = await schematicRunner.runSchematic('ng-add', options, appTree);
    const content = tree.readContent(`${projectPath}/src/app/app-module.ts`);
    expect(content).toMatch(
      /import { NgModule, provideBrowserGlobalErrorListeners, isDevMode } from '@angular\/core';/
    );
  });

  it('should fail if specified module does not exist', async () => {
    const options = { ...defaultOptions, module: '/src/app/app-moduleXXX.ts' };
    let thrownError: Error | null = null;
    try {
      await schematicRunner.runSchematic('ng-add', options, appTree);
    } catch (err: any) {
      thrownError = err;
    }
    expect(thrownError).toBeDefined();
  });

  it('should fail if negative maxAges', async () => {
    const options = { ...defaultOptions, maxAge: -4 };

    let thrownError: Error | null = null;
    try {
      await schematicRunner.runSchematic('ng-add', options, appTree);
    } catch (err: any) {
      thrownError = err;
    }
    expect(thrownError).toBeDefined();
  });

  it('should fail if maxAge of 1', async () => {
    const options = { ...defaultOptions, maxAge: -4 };

    let thrownError: Error | null = null;
    try {
      await schematicRunner.runSchematic('ng-add', options, appTree);
    } catch (err: any) {
      thrownError = err;
    }
    expect(thrownError).toBeDefined();
  });

  it('should support a custom maxAge', async () => {
    const options = {
      ...defaultOptions,
      name: 'State',
      maxAge: 5,
    };

    const tree = await schematicRunner.runSchematic('ng-add', options, appTree);
    const content = tree.readContent(`${projectPath}/src/app/app-module.ts`);
    expect(content).toMatch(/maxAge: 5/);
  });

  describe('Store Devtools ng-add Schematic for standalone application', () => {
    const projectPath = getTestProjectPath(undefined, {
      name: 'bar-standalone',
    });

    const standaloneDefaultOptions = {
      ...defaultOptions,
      project: 'bar-standalone',
    };

    it('provides initial setup', async () => {
      const options = { ...standaloneDefaultOptions };
      const tree = await schematicRunner.runSchematic(
        'ng-add',
        options,
        appTree
      );

      const content = tree.readContent(`${projectPath}/src/app/app.config.ts`);

      expect(content).toMatchSnapshot();
    });
  });
});
