<ngrx-docs-alert type="help">

**<a href="/guide/signals"><b>NgRx Signals</b></a> is the new default.**

The NgRx team recommends using the `@ngrx/signals` library for local state management in Angular.
While ComponentStore remains supported, we encourage using `@ngrx/signals` for new projects and considering migration for existing ones.

</ngrx-docs-alert>

# Usage

## Types of State

There are multiple types of state that exist in the application, and state management libraries are there to help manage/synchronize/update them. The topic of which one to choose, ComponentStore or the Global Store, or maybe both would be helpful, is described at [ComponentStore vs Store](guide/component-store/comparison) section.

The types of state that developers typically deal with in applications are:

- **Server/Backend(s) State**. This is the ultimate source of truth of all the data.
- **Persisted State**. The "snapshots" of backend data transferred _to_ and _from_ application. E.g. Movies data passed as a JSON response, or user's rating for a particular Movie passed as an update request.
- **URL State**. This is the state of the URL itself. Depending on which URL the user navigates to, the app would open specific pages and thus might request for _Persisted State_.
- **Client State**. The state within the application that is not persisted to the backend. E.g. The info about which Tab is open in the application.
- **Local UI State**. The state within a component itself. E.g. `isEnabled` toggle state of Toggle Component.

<figure>
  <img src="images/guide/component-store/types-of-state.png" alt="Types of state in a typical SPA" width="100%" height="100%" />
</figure>

There are more types of states, but these are the most important ones in the context of state management.

<ngrx-docs-alert type="inform">

Synchronizing these states is one of the most complex tasks that developers have to solve.

</ngrx-docs-alert>

Here is a small example to demonstrate how even a simple task might involve all of them:

1. The user opens the page at a specific URL, "https://www.TheBestMoviesOfAllTimeEver.com/favorites". That changes the **_URL State_**.
1. The URL has a path for a specific tab, "favorites". That selection becomes part of the **_Client State_**.
1. This results in API calls to the backend to get the data of the movies that the user marked as "favorites". We receive a snapshot of **_Persisted State_**.
1. The Toggle Component that lives next to the _"is favorite"_ label is turned ON. The "ON" state is derived from the data that the application received and passed to the Toggle Component through `@Input() isEnabled: boolean`. The component itself is not aware of _Persisted State_ or what it even means to be ON in the context of the rest of the application. All it knows is that it needs to be visually displayed as ON. The `isEnabled` state is **_Local UI State_**.
1. The user might decide that this movie is no longer their favorite and would click the Toggle button to turn it OFF. The _Local UI State_ of the component is then changed, the `@Output() changed` event is emitted and picked up by a container component which would then call the backend to update the _Persisted State_.

This was a very simple example. Typically developers have to solve many problems that are more interconnected. What if the user is not logged in? Should we wait until the new favorite state is persisted to the backend and only then show disabled state or should we do this optimistically? and so on.

<ngrx-docs-alert type="help">

Understanding these types of state helps us define our usage of ComponentStore.

</ngrx-docs-alert>

## Use Case 1: Local UI State

### Example 1: ComponentStore as part of the component

The simplest example usage of `ComponentStore` is **reactive _Local UI State_**.

<div class="callout is-helpful">
<header>A note about component reactivity</header>

One of the ways to improve the performance of the application is to use the `OnPush` change detection strategy. However, contrary to the popular belief, we do not always need to tell Angular's change detection to `markForCheck()` or `detectChanges()` (or the Angular Ivy alternatives). As pointed out in [this article on change detection](https://indepth.dev/the-last-guide-for-angular-change-detection-youll-ever-need/), if the event originates from the component itself, the component will be dirty checked.
This means that common presentational (aka dumb) components that interact with the rest of the application with Input(s)/Output(s) do not have to be overcomplicated with reactive state, even though we did it to the Toggle Component mentioned above.

</div>

Having said that, in most cases making _Local UI State_ **reactive** is beneficial:

- For Zoneless application, the `async` pipe can easily be substituted with a Zoneless alternative such as the [`ngrxPush` pipe](guide/component/push)
- For components with non-trivial business logic, reactivity can organize the state better by clearly separating actual state from derived values and identifying side-effects.

<ngrx-docs-alert type="help">

ComponentStore is not the only reactive _Local UI State_ holder - sometimes `FormControl`s are good enough. They contain the state and they have reactive APIs.

</ngrx-docs-alert>

Here's the simplified `SlideToggleComponent` example which uses `ComponentStore` for _Local UI State_. In this example, the `ComponentStore` is provided directly by the component itself, which might not be the best choice for most of the use cases of `ComponentStore`. Instead, consider a service that `extends ComponentStore`.

<ngrx-docs-alert type="help">

You can see the full example at StackBlitz: <live-example name="component-store-slide-toggle"></live-example>

</ngrx-docs-alert>

<code-tabs linenums="true">
  <code-pane
    header="src/app/slide-toggle.component.ts"
    path="component-store-slide-toggle/src/app/slide-toggle.component.ts">
  </code-pane>
  <code-pane
    header="src/app/slide-toggle.html"
    path="component-store-slide-toggle/src/app/slide-toggle.html">
  </code-pane>
</code-tabs>

Below are the steps of integrating `ComponentStore` into a component.

#### Step 1. Setting up

First, the state for the component needs to be identified. In `SlideToggleComponent` only the state of whether the toggle is turned ON or OFF is stored.

<ngrx-code-example
  header="src/app/slide-toggle.component.ts"
  path="component-store-slide-toggle/src/app/slide-toggle.component.ts"
  region="state">

```ts
export interface SlideToggleState {
  checked: boolean;
}
```

</ngrx-code-example>

Then we need to provide `ComponentStore` in the component's providers, so that each new instance of `SlideToggleComponent` has its own `ComponentStore`. It also has to be injected into the constructor.

<ngrx-docs-alert type="inform">

In this example `ComponentStore` is provided directly in the component. This works for simple cases, however in real-world cases it is recommended to create a separate Service, for example `SlideToggleStore`, that would extend `ComponentStore` and would contain all the business logic. This new Service is then provided in the component. See examples below.

</ngrx-docs-alert>

<ngrx-code-example linenums="false"
  header="src/app/slide-toggle.component.ts"
  path="component-store-slide-toggle/src/app/slide-toggle.component.ts"
  region="providers">

```ts
@Component({
  selector: 'mat-slide-toggle',
  templateUrl: 'slide-toggle.html',
```

</ngrx-code-example>

Next, the default state for the component needs to be set. It could be done lazily, however it needs to be done before any of `updater`s are executed, because they rely on the state to be present and would throw an error if the state is not initialized by the time they are invoked.

State is initialized by calling `setState` and passing an object that matches the interface of `SlideToggleState`.

<ngrx-docs-alert type="inform">

`setState` could be called with either an object or a callback.

When it is called with an object, state is initialized or reset to that object.

When it is called with a callback, the state is updated.

</ngrx-docs-alert>

<ngrx-code-example
  header="src/app/slide-toggle.component.ts"
  path="component-store-slide-toggle/src/app/slide-toggle.component.ts"
  region="init">

```ts
constructor(
  private readonly componentStore: ComponentStore<SlideToggleState>
) {
  // set defaults
  this.componentStore.setState({
    checked: false,
  });
}
```

</ngrx-code-example>

#### Step 2. Updating state

In the slide-toggle example, the state is updated either through `@Input` or by a user interaction, which results in a `onChangeEvent($event)` call in the template. Both of them change the same piece of state - `checked: boolean`, thus we have the `setChecked` updater that is reused in two places. This updater describes **HOW** the state changes - it takes the current state and a value and returns the new state.

`@Input` here is a setter function that passes the value to the `setChecked` updater.

When a user clicks the toggle (triggering a 'change' event), instead of calling the same updater directly, the `onChangeEvent` effect is called. This is done because we also need to have the side-effect of `event.source.stopPropagation` to prevent this event from bubbling up (slide-toggle output event in named 'change' as well) and only after that the `setChecked` updater is called with the value of the input element.

<ngrx-code-example linenums="false"
  header="src/app/slide-toggle.component.ts"
  path="component-store-slide-toggle/src/app/slide-toggle.component.ts"
  region="updater">

```ts
@Input() set checked(value: boolean) {
    this.setChecked(value);
  }
```

</ngrx-code-example>

#### Step 3. Reading the state

Finally, the state is aggregated with selectors into two properties:

- `vm$` property collects all the data needed for the template - this is the _ViewModel_ of `SlideToggleComponent`.
- `change` is the `@Output` of `SlideToggleComponent`. Instead of creating an `EventEmitter`, here the output is connected to the Observable source directly.

<ngrx-code-example
  header="src/app/slide-toggle.component.ts"
  path="component-store-slide-toggle/src/app/slide-toggle.component.ts"
  region="selector">

```ts
// Observable<MatSlideToggleChange> used instead of EventEmitter
  @Output() readonly change = this.componentStore.select((state) => ({
    source: this,
    checked: state.checked,
  }));
```

</ngrx-code-example>

This example does not have a lot of business logic, however it is still fully reactive.

### Example 2: Service extending ComponentStore

`SlideToggleComponent` is a fairly simple component and having `ComponentStore` within the component itself is still manageable. When components takes more Inputs and/or has more events within its template, it becomes larger and harder to read/maintain.

Extracting the business logic of a component into a separate Service also helps reduce the cognitive load while reading the components code.

<ngrx-docs-alert type="inform">

A Service that extends ComponentStore and contains business logic of the component brings many advantages. **This is also the recommended usage of ComponentStore**.

</ngrx-docs-alert>

`ComponentStore` was designed with such an approach in mind. The main APIs of `ComponentStore` (`updater`, `select` and `effect`) are meant to wrap the **HOW** state is changed, extracted or effected, and then called with arguments.

Below are the two examples of a re-implemented [Paginator component](https://material.angular.io/components/paginator/overview) from Angular Material (a UI component library). These re-implementations are very functionally close alternatives.

Here's the source code of the [Material's paginator.ts](https://github.com/angular/components/blob/23d3c216c65b327e0acfb48b53302b8fda326e7f/src/material/paginator/paginator.ts#L112) as a reference.

What we can see is that while the _"PaginatorComponent providing ComponentStore"_ example already makes the component a lot smaller, reactive, removes `this._changeDetectorRef.markForCheck()` and organizes it into distinct "read"/"write"/"effect" buckets, it still could be hard to read. The _"PaginatorComponent with PaginatorStore"_ example adds readability and further improves the testability of behaviors and business logic.

<ngrx-docs-alert type="help">

You can see the examples at StackBlitz:

- "PaginatorComponent providing ComponentStore" <live-example name="component-store-paginator" noDownload></live-example>
- "PaginatorComponent with PaginatorStore Service" <live-example name="component-store-paginator-service" noDownload></live-example>

</ngrx-docs-alert>

<code-tabs linenums="true">
  <code-pane
    header="PaginatorComponent with PaginatorStore Service"
    path="component-store-paginator-service/src/app/paginator.component.ts">
  </code-pane>
  <code-pane
    header="PaginatorComponent providing ComponentStore"
    path="component-store-paginator/src/app/paginator.component.ts">
  </code-pane>
  <code-pane
    header="src/app/paginator.store.ts"
    path="component-store-paginator-service/src/app/paginator.store.ts">
  </code-pane>
</code-tabs>

#### Updating the state

With `ComponentStore` extracted into `PaginatorStore`, the developer is now using updaters and effects to update the state. `@Input` values are passed directly into `updater`s as their arguments.

<ngrx-code-example
  header="src/app/paginator.store.ts"
  path="component-store-paginator-service/src/app/paginator.component.ts"
  region="inputs">

```ts
@Input() set pageIndex(value: string | number) {
    this.paginatorStore.setPageIndex(value);
  }

  @Input() set length(value: string | number) {
    this.paginatorStore.setLength(value);
  }

  @Input() set pageSize(value: string | number) {
    this.paginatorStore.setPageSize(value);
  }

  @Input() set pageSizeOptions(value: readonly number[]) {
    this.paginatorStore.setPageSizeOptions(value);
  }
```

</ngrx-code-example>

Not all `updater`s have to be called in the `@Input`. For example, `changePageSize` is called from the template.

Effects are used to perform additional validation and get extra information from sources with derived data (i.e. selectors).

<ngrx-code-example
  header="src/app/paginator.store.ts"
  path="component-store-paginator-service/src/app/paginator.component.ts"
  region="updating-state">

```ts
changePageSize(newPageSize: number) {
    this.paginatorStore.changePageSize(newPageSize);
  }
  nextPage() {
    this.paginatorStore.nextPage();
  }
  firstPage() {
    this.paginatorStore.firstPage();
  }
  previousPage() {
    this.paginatorStore.previousPage();
  }
  lastPage() {
    this.paginatorStore.lastPage();
  }
```

</ngrx-code-example>

#### Reading the state

`PaginatorStore` exposes the two properties: `vm$` for an aggregated _ViewModel_ to be used in the template and `page$` that would emit whenever data aggregated from a `PageEvent` changes.

<code-tabs>
  <code-pane
    header="src/app/paginator.component.ts"
    path="component-store-paginator-service/src/app/paginator.component.ts"
    region="selectors"
    >
  </code-pane>
  <code-pane
    header="src/app/paginator.store.ts"
    path="component-store-paginator-service/src/app/paginator.store.ts"
    region="selectors">
  </code-pane>
</code-tabs>

<ngrx-docs-alert type="help">

`page$` would emit `PageEvent` when page size or page index changes, however in some cases updater would update both of these properties at the same time. To avoid "intermediary" emissions, `page$` selector is using **`{debounce: true}`** configuration. More about debouncing can be found in [selector section](guide/component-store/read#debounce-selectors).

</ngrx-docs-alert>

### Local UI State patterns

Components that use `ComponentStore` for managing **Local UI State** are frequently calling `updater`s directly.

Effects can also be used when:

- side effects are required (e.g. `event.stopPropagation()`)
- derived data (from selectors) is needed to influence the new state
- they are orchestrating a number of well-defined updaters

The last point can sometimes be refactored into another `updater`. Use your best judgment.

`@Output()`s and derived data are **reacting** to these state changes and are generated using `selector`s.

A _ViewModel_ for the component is also composed from `selector`s.
