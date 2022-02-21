// TODO: if it's needed here or should be a peer dependency
import 'reflect-metadata';
import SimpleSchema, { AutoValueContext, SchemaDefinition } from 'simpl-schema';

export const SimpleSchemaSymbol = Symbol('SimpleSchema');
export const METADATA_TYPE_KEY = 'design:type';

// TODO: define happy path for mixings

export interface PropertyAnnotation {
  (target: any, propertyKey: string | symbol): void;
}

// TS metadata
// "design:type"
// "design:paramtypes"
// "design:returntype"
type ValidationOptions = Parameters<SimpleSchema['validator']>[0];
export function getValidator(entity: any, options?: ValidationOptions) {
  return new SimpleSchema(entity[SimpleSchemaSymbol]).validator(options);
}

export function getSchema(entity: any) {
  return new SimpleSchema(entity[SimpleSchemaSymbol]);
}

function deriveBaseSchema(target: any): any {
  if (target && typeof target === 'object') {
    const prototype = Object.getPrototypeOf(target);
    if (prototype) {
      return {
        ...deriveBaseSchema(prototype),
        ...(Object.prototype.hasOwnProperty.call(prototype, SimpleSchemaSymbol)
          ? prototype[SimpleSchemaSymbol]
          : {}),
      };
    }
  }
  return {};
}

function ensureSimpleSchemaSymbol<T = { [SimpleSchemaSymbol]?: any }>(
  target: T,
): T & { [SimpleSchemaSymbol]: any } {
  if (!Object.prototype.hasOwnProperty.call(target, SimpleSchemaSymbol)) {
    Object.defineProperty(target, SimpleSchemaSymbol, {
      value: deriveBaseSchema(target),
    });
  }
  return target as T & { [SimpleSchemaSymbol]: any };
}

// TODO: there is a caveat with derived union types/aliases where it sees them as object,
//       to overcome that it's possible to add @validate, but it has to be the first decorator
//       on the property to work correctly.
export function validate({
  members,
  type,
  constraints,
}: { members?: any; type?: any; constraints?: any } = {}): PropertyAnnotation {
  return (target, propertyKey) => {
    ensureSimpleSchemaSymbol(target);

    let schemaType = Reflect.getMetadata(
      METADATA_TYPE_KEY,
      target,
      propertyKey,
    );

    if (
      typeof schemaType === 'function' &&
      ![String, Number, Boolean, Array].includes(schemaType)
    ) {
      schemaType = getSchema(new schemaType());
    }

    target[SimpleSchemaSymbol][propertyKey] = {
      // TODO: think about better way for handling these cases
      // where multiple decorators are used on single property
      ...target[SimpleSchemaSymbol][propertyKey],
      ...constraints,
      type: type ?? schemaType,
    };
    // TODO: need to add check if members is not a decorated class, but a constructor for primitive
    // TODO: if primiteve value constructor, how to add things like `min`?
    if (members && schemaType === Array) {
      const memberSchemaDefinition = Object.hasOwnProperty.call(members, 'type')
        ? members
        : new SimpleSchema(new members()[SimpleSchemaSymbol]);
      target[SimpleSchemaSymbol][`${String(propertyKey)}.$`] =
        memberSchemaDefinition;
    }
  };
}

export function oneOf(...types: any[]) {
  return (target, propertyKey) => {
    ensureSimpleSchemaSymbol(target);
    target[SimpleSchemaSymbol][propertyKey] = {
      ...target[SimpleSchemaSymbol][propertyKey],
      // TODO: handle the nested schema cases
      type: SimpleSchema.oneOf(...types),
    };
  };
}

// taken and adjusted from
// https://github.com/aldeed/simpl-schema/blob/main/package/lib/SimpleSchema.js#L24-L37
const oneOfProps = [
  // 'type',
  'min',
  'max',
  'minCount',
  'maxCount',
  'allowedValues',
  'exclusiveMin',
  'exclusiveMax',
  'regEx',
  'custom',
  'blackbox',
  'trim',
];

function createConstraint(options) {
  return function <T>(
    target: any,
    prop: string,
    descriptor: TypedPropertyDescriptor<T>,
  ) {
    validate(options)(target, prop);
    return descriptor;
  };
}

// NOTE: creating and exporting manually to allow them to be treeshakeable
export function Integer(): any {
  return createConstraint({ type: SimpleSchema.Integer });
}

export function min(min: number): any {
  return createConstraint({ constraints: { min } });
}

export function max(max: number): any {
  return createConstraint({ constraints: { max } });
}

export function maxCount(count: number): any {
  return createConstraint({ constraints: { maxCount: count } });
}

export function minCount(count: number): any {
  return createConstraint({ constraints: { minCount: count } });
}

export function allowedValues<T>(values: T[]): any {
  return createConstraint({ constraints: { allowedValues: values } });
}

export function defaultValue<T>(value: T): any {
  return createConstraint({ constraints: { defaultValue: value } });
}

export function regEx(regex: RegExp): any {
  return createConstraint({ constraints: { regEx: regex } });
}

// TODO: check if possible to derive optionality from the `?:` operator
export function optional(optional = true): any {
  return createConstraint({ constraints: { optional } });
}

type Validator = NonNullable<SchemaDefinition['custom']>;
interface ValidatorWithContextArgs {
  (ctx: ThisParameterType<Validator>): ReturnType<Validator>;
}

export function custom(cb: ValidatorWithContextArgs): any {
  return createConstraint({
    constraints: {
      custom() {
        return cb(this);
      },
    },
  });
}

interface AutoValueCallback {
  (ctx: AutoValueContext): any;
}

export function autoValue(cb: AutoValueCallback): any {
  return createConstraint({
    constraints: {
      autoValue() {
        return cb(this);
      },
    },
  });
}

// Custom validators with higher level of abstraction not in the simpl-schema
export function constant<T>(value: T): any {
  return createConstraint({
    constraints: {
      allowedValues: [value],
    },
  });
}
