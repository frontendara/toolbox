import "reflect-metadata";
import SimpleSchema from "simpl-schema";
import {
  getValidator,
  Integer,
  validate,
  oneOf,
  min,
  maxCount,
  allowedValues,
  regEx,
  custom,
  minCount,
  optional,
  defaultValue,
  constant,
  max,
} from ".";

const StockType = {
  Skis: "skis",
  SkiBoots: "ski-boots",
  SnowboardBoots: "snowboard-boots",
  Snowboard: "snowboard",
  Helmet: "helmet",
} as const;

const SkisRegex = /sk-\d{6}/;
const SnowboardRegex = /sb-\d{6}/;
const SkiBootsRegex = /bt-\d{6}/;
const SnowboardBootsRegex = /btd-\d{6}/;
const HelmetRegex = /hm-\d{6}/;

const StockTypeRegexMap = {
  [StockType.Skis]: SkisRegex,
  [StockType.Snowboard]: SnowboardRegex,
  [StockType.SkiBoots]: SkiBootsRegex,
  [StockType.SnowboardBoots]: SnowboardBootsRegex,
  [StockType.Helmet]: HelmetRegex,
};

describe("complex arrangement", function () {
  let validator;
  class InventoryItem {
    @allowedValues(["skis", "ski-boots"])
    stockType: "skis" | "ski-boots";

    @regEx(/[a-z]{2,3}-\d{6}/)
    @custom((ctx) => {
      const { value: inventory } = ctx.field("inventory");
      const stockType = inventory.find(
        (i) => i.barcode === ctx.value
      ).stockType;
      if (!stockType) {
        return SimpleSchema.ErrorTypes.REQUIRED;
      }
      if (!StockTypeRegexMap[stockType]) {
        return SimpleSchema.ErrorTypes.VALUE_NOT_ALLOWED;
      }
      if (!StockTypeRegexMap[stockType].test(ctx.value)) {
        return SimpleSchema.ErrorTypes.FAILED_REGULAR_EXPRESSION;
      }
    })
    barcode?: string;

    @validate()
    displayName?: string;
  }

  class UpdateKitDTO {
    @min(1)
    orderId: string;
    @Integer()
    index: number;
    @validate({ members: InventoryItem })
    @maxCount(3)
    inventory: InventoryItem[];

    @validate({ members: { type: Number, min: -180, max: 180 } })
    @minCount(2)
    @maxCount(2)
    @optional()
    coordinates: [number, number];
  }

  beforeEach(function () {
    validator = getValidator(new UpdateKitDTO());
  });
  it("it throws if number is not an integer", function () {
    const notInteger = {
      orderId: "213",
      index: 0.5,
      inventory: [],
    };
    expect(() => validator(notInteger)).toThrow(/Index must be an integer/);
  });
  it("throws if `min` is not correct", function () {
    const toShortId = {
      orderId: "",
      index: 1,
      inventory: [],
    };
    expect(() => validator(toShortId)).toThrow(
      /Order ID must be at least 1 characters/
    );
  });
  it("throws if `maxCount` is incorrect", function () {
    const toMany = {
      orderId: "0",
      index: 1,
      inventory: [
        { stockType: "skis", barcode: "sk-000001", displayName: "hello" },
        { stockType: "skis", barcode: "sk-000001", displayName: "hello" },
        { stockType: "skis", barcode: "sk-000001", displayName: "hello" },
        { stockType: "skis", barcode: "sk-000001", displayName: "hello" },
      ],
    };

    expect(() => validator(toMany)).toThrow(
      /You cannot specify more than 3 values/
    );
  });
  it("throws if item is not in allowed values", function () {
    const toMany = {
      orderId: "0",
      index: 1,
      inventory: [
        { stockType: "snowboard", barcode: "sk-000001", displayName: "hello" },
      ],
    };

    expect(() => validator(toMany)).toThrow(
      /snowboard is not an allowed value/
    );
  });
  it("throws if regex is not matching", function () {
    const toMany = {
      orderId: "0",
      index: 1,
      inventory: [
        { stockType: "skis", barcode: "s-000001", displayName: "hello" },
      ],
    };

    expect(() => validator(toMany)).toThrow(
      /Barcode failed regular expression validation/
    );
  });
  describe("array member primitive validation", function () {
    it("handles simple number type constraints for members of array", function () {
      const number = {
        orderId: "0",
        index: 1,
        inventory: [
          { stockType: "skis", barcode: "sk-000001", displayName: "hello" },
        ],
        coordinates: [0, 0],
      };

      expect(() => validator(number)).not.toThrow();
    });
    it("handles member validation", function () {
      const number = {
        orderId: "0",
        index: 1,
        inventory: [
          { stockType: "skis", barcode: "sk-000001", displayName: "hello" },
        ],
        coordinates: [0, 190],
      };

      expect(() => validator(number)).toThrow(/Coordinates cannot exceed 180/);
    });
  });

  it("handles custom validators", function () {
    const badBarcode = {
      orderId: "0",
      index: 1,
      inventory: [
        { stockType: "skis", barcode: "ss-000001", displayName: "hello" },
      ],
    };

    expect(() => validator(badBarcode)).toThrow(
      /Barcode failed regular expression validation/
    );
  });
});

describe("nested class validation", function () {
  class GeoJSONPointDTO {
    @allowedValues(["Point"])
    @defaultValue("Point")
    type: "Point";

    @validate({ members: { type: Number, min: -180, max: 180 } })
    @minCount(2)
    @maxCount(2)
    coordinates: [number, number];
  }

  class Accommodation {
    @validate({ members: GeoJSONPointDTO })
    @minCount(1)
    @maxCount(1)
    location: GeoJSONPointDTO;
  }
  it("correctly validates nested clases", function () {
    const withPoint = {
      location: {
        type: "Point",
        coordinates: [0, 0],
      },
    };

    expect(() => getValidator(new Accommodation())(withPoint)).not.toThrow();
  });
  it("throws if nested object is invalid", function () {
    const withPoint = {
      location: {
        coordinates: [0, 0],
      },
    };

    expect(() => getValidator(new Accommodation())(withPoint)).toThrow(
      /Type is required/
    );
  });
});
describe("oneOf validations", function () {
  class OneOfDTO {
    @oneOf(String, Number)
    someUnionType: string | number;
  }

  it("throws if oneOf is not valid", function () {
    const oneExample = {
      someUnionType: true,
    };

    expect(() => getValidator(new OneOfDTO())(oneExample)).toThrow(
      /Some union type must be of type String/
    );
  });
  it("passes with string type", function () {
    const oneExample = {
      someUnionType: "string",
    };

    expect(() => getValidator(new OneOfDTO())(oneExample)).not.toThrow();
  });
  it("passes with number type", function () {
    const oneExample = {
      someUnionType: 5,
    };

    expect(() => getValidator(new OneOfDTO())(oneExample)).not.toThrow();
  });
});

describe("constant value", function () {
  class ConstantDTO {
    @constant("hello")
    @optional()
    stringConstant: "hello";

    @constant(5)
    @optional()
    numberConstant: 5;
  }

  it("should understand string constants", function () {
    const stringConstant = {
      stringConstant: "hello",
    };
    expect(() => getValidator(new ConstantDTO())(stringConstant)).not.toThrow();
  });
  it("should throw if string constant is invalid", function () {
    const stringConstant = {
      stringConstant: "world",
    };
    expect(() => getValidator(new ConstantDTO())(stringConstant)).toThrow(
      /world is not an allowed value/
    );
  });
  it("should understand number constants", function () {
    const stringConstant = {
      numberConstant: 5,
    };
    expect(() => getValidator(new ConstantDTO())(stringConstant)).not.toThrow();
  });
  it("should throw if number constant is invalid", function () {
    const stringConstant = {
      numberConstant: 6,
    };
    expect(() => getValidator(new ConstantDTO())(stringConstant)).toThrow(
      /6 is not an allowed value/
    );
  });
});

describe("min and max for numbers", function () {
  class NumberDTO {
    @min(5)
    @max(10)
    number: number;
  }
  it("throws if min is smaller than defined", function () {
    const number = {
      number: 4,
    };
    expect(() => getValidator(new NumberDTO())(number)).toThrow(
      /Number must be at least 5/
    );
  });
  it("throws if max is bigger than defined", function () {
    const number = {
      number: 11,
    };

    expect(() => getValidator(new NumberDTO())(number)).toThrow(
      /Number cannot exceed 10/
    );
  });
  it("passes if min is bigger than defined", function () {
    const number = {
      number: 6,
    };
    expect(() => getValidator(new NumberDTO())(number)).not.toThrow();
  });
});

describe("custom validator", function () {
  class WithCustomPotato {
    @custom((ctx) => {
      const value = ctx.value;
      if (value !== "potato") {
        return "should be potato";
      }
    })
    vegetable: string;
  }
  it("it validates with custom field", function () {
    const potato = {
      vegetable: "potato",
    };

    expect(() => getValidator(new WithCustomPotato())(potato)).not.toThrow();
  });
  it("throws if custom validator returns a string", function () {
    const potato = {
      vegetable: "carrot",
    };
    expect(() => getValidator(new WithCustomPotato())(potato)).toThrow(
      /vegetable is invalid/
    );
  });
});
