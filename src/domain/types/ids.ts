declare const brand: unique symbol;

export type Brand<TValue, TBrand extends string> = TValue & {
  readonly [brand]: TBrand;
};

export type ClanId = Brand<string, 'ClanId'>;
export type CastleId = Brand<string, 'CastleId'>;
export type RouteId = Brand<string, 'RouteId'>;
