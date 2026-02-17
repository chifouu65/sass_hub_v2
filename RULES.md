# Code Quality Rules

## TypeScript Best Practices
- **Strict Mode**: Use strict type checking.
- **Type Inference**: Prefer type inference when the type is obvious.
- **Avoid `any`**: Avoid the `any` type; use `unknown` when type is uncertain.

## Angular Best Practices
- **Standalone Everything**: Always use standalone components over NgModules.
- **Decorator Cleanliness**: Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- **State management**: Use signals for state management.
- **Routing**: Implement lazy loading for feature routes.
- **Host interactions**: Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead.
- **Images**: Use `NgOptimizedImage` for all static images. *Note: NgOptimizedImage does not work for inline base64 images.*

## Accessibility Requirements
- **AXE Checks**: It MUST pass all AXE checks.
- **WCAG Standards**: It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

## Components
- **Responsibility**: Keep components small and focused on a single responsibility.
- **Signals**: Use `input()` and `output()` functions instead of decorators.
- **Derived State**: Use `computed()` for derived state.
- **Performance**: Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator.
- **Templates**: Prefer inline templates for small components.
- **Forms**: Prefer Reactive forms instead of Template-driven ones.
- **Bindings**: Do NOT use `ngClass`, use class bindings instead. Do NOT use `ngStyle`, use style bindings instead.
- **Paths**: When using external templates/styles, use paths relative to the component TS file.

## State Management
- **Local State**: Use signals for local component state.
- **Derived Data**: Use `computed()` for derived state.
- **Predictability**: Keep state transformations pure and predictable.
- **Mutations**: Do NOT use `mutate` on signals, use `update` or `set` instead.

## Templates
- **Logic**: Keep templates simple and avoid complex logic.
- **Control Flow**: Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`.
- **Observables**: Use the `async` pipe to handle observables.
- **Globals**: Do not assume globals like `(new Date())` are available.
- **Syntax**: Do not write arrow functions in templates (they are not supported).

## Services
- **Design**: Design services around a single responsibility.
- **Scope**: Use the `providedIn: 'root'` option for singleton services.
- **Injection**: Use the `inject()` function instead of constructor injection.
