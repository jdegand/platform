import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { Schema as EffectOptions } from './schema';
import {
  getTestProjectPath,
  createWorkspace,
  createAppModuleWithEffects,
  defaultWorkspaceOptions,
  defaultAppOptions,
} from '@ngrx/schematics-core/testing';

describe('Effect Schematic', () => {
  const schematicRunner = new SchematicTestRunner(
    '@ngrx/schematics',
    path.join(__dirname, '../../collection.json')
  );

  const defaultOptions: EffectOptions = {
    name: 'foo',
    project: 'bar',
    module: undefined,
    flat: false,
    feature: false,
    root: false,
    group: false,
    prefix: 'load',
  };

  const projectPath = getTestProjectPath();

  let appTree: UnitTestTree;

  beforeEach(async () => {
    appTree = await createWorkspace(schematicRunner, appTree);
  });

  it('should create an effect to specified project if provided', async () => {
    const options = {
      ...defaultOptions,
      project: 'baz',
    };

    const specifiedProjectPath = getTestProjectPath(defaultWorkspaceOptions, {
      ...defaultAppOptions,
      name: 'baz',
    });

    const tree = await schematicRunner.runSchematic('effect', options, appTree);
    const files = tree.files;
    expect(
      files.indexOf(`${specifiedProjectPath}/src/lib/foo/foo.effects.spec.ts`)
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(`${specifiedProjectPath}/src/lib/foo/foo.effects.ts`)
    ).toBeGreaterThanOrEqual(0);
  });

  it('should create an effect with a spec file', async () => {
    const options = { ...defaultOptions };

    const tree = await schematicRunner.runSchematic('effect', options, appTree);
    const files = tree.files;
    expect(
      files.indexOf(`${projectPath}/src/app/foo/foo.effects.spec.ts`)
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(`${projectPath}/src/app/foo/foo.effects.ts`)
    ).toBeGreaterThanOrEqual(0);
  });

  it('should not be provided by default', async () => {
    const options = { ...defaultOptions };

    const tree = await schematicRunner.runSchematic('effect', options, appTree);
    const content = tree.readContent(`${projectPath}/src/app/app-module.ts`);
    expect(content).not.toMatch(/FooEffects/);
    expect(content).toMatchSnapshot();
  });

  it('should import into a specified module when provided', async () => {
    const options = { ...defaultOptions, module: 'app-module.ts' };

    const tree = await schematicRunner.runSchematic('effect', options, appTree);
    const content = tree.readContent(`${projectPath}/src/app/app-module.ts`);
    expect(content).toMatch(/FooEffects/);
    expect(content).toMatchSnapshot();
  });

  it('should fail if specified module does not exist', async () => {
    const options = {
      ...defaultOptions,
      module: `${projectPath}/src/app/app.moduleXXX.ts`,
    };
    await expect(
      schematicRunner.runSchematic('effects', options, appTree)
    ).rejects.toThrowError();
  });

  it('should respect the skipTests flag', async () => {
    const options = { ...defaultOptions, skipTests: true };

    const tree = await schematicRunner.runSchematic('effect', options, appTree);
    const files = tree.files;
    expect(
      files.indexOf(`${projectPath}/src/app/foo/foo.effects.ts`)
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(`${projectPath}/src/app/foo/foo.effects.spec.ts`)
    ).toEqual(-1);
  });

  it('should group within an "effects" folder if group is set', async () => {
    const options = {
      ...defaultOptions,
      flat: true,
      skipTests: true,
      group: true,
    };

    const tree = await schematicRunner.runSchematic('effect', options, appTree);
    const files = tree.files;
    expect(
      files.indexOf(`${projectPath}/src/app/effects/foo.effects.ts`)
    ).toBeGreaterThanOrEqual(0);
  });

  it('should group and nest the effect within a feature', async () => {
    const options = {
      ...defaultOptions,
      skipTests: true,
      group: true,
      flat: false,
      feature: true,
    };

    const tree = await schematicRunner.runSchematic('effect', options, appTree);
    const files = tree.files;
    expect(
      files.indexOf(`${projectPath}/src/app/effects/foo/foo.effects.ts`)
    ).toBeGreaterThanOrEqual(0);

    const content = tree.readContent(
      `${projectPath}/src/app/effects/foo/foo.effects.ts`
    );

    expect(content).toMatchSnapshot();
  });

  it('should inject the effect service correctly within the spec', async () => {
    const options = { ...defaultOptions };
    const tree = await schematicRunner.runSchematic('effect', options, appTree);
    const content = tree.readContent(
      `${projectPath}/src/app/foo/foo.effects.spec.ts`
    );

    expect(content).toMatch(/effects = TestBed\.inject\(FooEffects\);/);
    expect(content).toMatchSnapshot();
  });

  describe('root effects', () => {
    it('should register the root effect in the provided module', async () => {
      const options = {
        ...defaultOptions,
        root: true,
        module: 'app-module.ts',
      };

      const tree = await schematicRunner.runSchematic(
        'effect',
        options,
        appTree
      );
      const content = tree.readContent(`${projectPath}/src/app/app-module.ts`);

      expect(content).toMatch(/EffectsModule\.forRoot\(\[FooEffects\]\)/);
      expect(content).toMatchSnapshot();
    });

    it('should register the root effect module without effect with the minimal flag', async () => {
      const options = {
        ...defaultOptions,
        root: true,
        name: undefined,
        module: 'app-module.ts',
        minimal: true,
      };

      const tree = await schematicRunner.runSchematic(
        'effect',
        options,
        appTree
      );
      const content = tree.readContent(`${projectPath}/src/app/app-module.ts`);

      expect(content).toMatch(/EffectsModule\.forRoot\(\[\]\)/);
      expect(content).not.toMatch(/FooEffects/);
      expect(content).toMatchSnapshot();
    });

    it('should add an effect to the empty array of registered effects', async () => {
      const storeModule = `${projectPath}/src/app/store.module.ts`;
      const options = {
        ...defaultOptions,
        root: true,
        module: 'store.module.ts',
      };
      appTree = createAppModuleWithEffects(
        appTree,
        storeModule,
        'EffectsModule.forRoot([])'
      );

      const tree = await schematicRunner.runSchematic(
        'effect',
        options,
        appTree
      );
      const content = tree.readContent(storeModule);

      expect(content).toMatch(/EffectsModule\.forRoot\(\[FooEffects\]\)/);
      expect(content).toMatchSnapshot();
    });

    it('should add an effect to the existing registered root effects', async () => {
      const storeModule = `${projectPath}/src/app/store.module.ts`;
      const options = {
        ...defaultOptions,
        root: true,
        module: 'store.module.ts',
      };
      appTree = createAppModuleWithEffects(
        appTree,
        storeModule,
        'EffectsModule.forRoot([UserEffects])'
      );

      const tree = await schematicRunner.runSchematic(
        'effect',
        options,
        appTree
      );
      const content = tree.readContent(storeModule);

      expect(content).toMatch(
        /EffectsModule\.forRoot\(\[UserEffects, FooEffects\]\)/
      );
      expect(content).toMatchSnapshot();
    });

    it('should create an effect that does not define a source of actions within the root', async () => {
      const options = { ...defaultOptions, root: true };

      const tree = await schematicRunner.runSchematic(
        'effect',
        options,
        appTree
      );
      const content = tree.readContent(
        `${projectPath}/src/app/foo/foo.effects.ts`
      );
      expect(content).toMatchSnapshot();
    });
  });

  describe('feature effects', () => {
    it('should still register the feature effect module with an effect with the minimal flag', async () => {
      const options = {
        ...defaultOptions,
        root: false,
        module: 'app-module.ts',
        minimal: true,
      };

      const tree = await schematicRunner.runSchematic(
        'effect',
        options,
        appTree
      );
      const content = tree.readContent(`${projectPath}/src/app/app-module.ts`);

      expect(content).toMatch(/EffectsModule\.forFeature\(\[FooEffects\]\)/);
      expect(
        tree.files.indexOf(`${projectPath}/src/app/foo/foo.effects.ts`)
      ).toBeGreaterThanOrEqual(0);

      expect(content).toMatchSnapshot();
    });

    it('should add an effect to the existing registered feature effects', async () => {
      const storeModule = `${projectPath}/src/app/store.module.ts`;
      const options = { ...defaultOptions, module: 'store.module.ts' };
      appTree = createAppModuleWithEffects(
        appTree,
        storeModule,
        `EffectsModule.forRoot([RootEffects])\n    EffectsModule.forFeature([UserEffects])`
      );

      const tree = await schematicRunner.runSchematic(
        'effect',
        options,
        appTree
      );
      const content = tree.readContent(storeModule);

      expect(content).toMatch(
        /EffectsModule\.forFeature\(\[UserEffects, FooEffects\]\)/
      );
      expect(content).toMatchSnapshot();
    });

    it('should not add an effect to registered effects defined with a variable', async () => {
      const storeModule = `${projectPath}/src/app/store.module.ts`;
      const options = { ...defaultOptions, module: 'store.module.ts' };
      appTree = createAppModuleWithEffects(
        appTree,
        storeModule,
        'EffectsModule.forRoot(effects)'
      );

      const tree = await schematicRunner.runSchematic(
        'effect',
        options,
        appTree
      );
      const content = tree.readContent(storeModule);

      expect(content).not.toMatch(/EffectsModule\.forRoot\(\[FooEffects\]\)/);
      expect(content).toMatchSnapshot();
    });

    it('should create an effect that describes a source of actions within a feature', async () => {
      const options = { ...defaultOptions, feature: true };

      const tree = await schematicRunner.runSchematic(
        'effect',
        options,
        appTree
      );
      const content = tree.readContent(
        `${projectPath}/src/app/foo/foo.effects.ts`
      );
      expect(content).toMatchSnapshot();
    });
  });

  it('should create an api effect that describes a source of actions within a feature', async () => {
    const options = { ...defaultOptions, feature: true, api: true };

    const tree = await schematicRunner.runSchematic('effect', options, appTree);
    const content = tree.readContent(
      `${projectPath}/src/app/foo/foo.effects.ts`
    );
    expect(content).toMatchSnapshot();
  });

  it('should add prefix to the effect', async () => {
    const options = {
      ...defaultOptions,
      api: true,
      feature: true,
      prefix: 'custom',
    };

    const tree = await schematicRunner.runSchematic('effect', options, appTree);
    const content = tree.readContent(
      `${projectPath}/src/app/foo/foo.effects.ts`
    );
    expect(content).toMatchSnapshot();
  });
});
