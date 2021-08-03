import { APIError } from 'lib/model/error';

interface ModelConstructor<Model, ModelURLParams> {
  fromURLParams: (json: ModelURLParams) => Model;
}

/**
 * Verifies that the given HTTP request query is the URL query params form of a
 * certain data model.
 * @param query - The HTTP request query (i.e. the model in URLParams form).
 * @param isModelURLParams - Custom typeguard that checks if the URL query
 * params are valid.
 * @param Model - Constructor for the model class (`M`).
 * @return A new instance of the model class (`M`) initialized using the given
 * URLParams query (i.e. the result of `M.fromURLParams(query)`).
 * @example
 * const match = await verifyQuery(req.query, isMatchURLParams, Match);
 * @example
 * const match = await verifyQuery<MatchURLParams, Match>(req.query, isMatchURLParams, Match);
 */
export default function verifyQuery<
  M,
  MJ,
  MC extends ModelConstructor<M, MJ> = ModelConstructor<M, MJ>
>(
  query: unknown,
  isModelURLParams: (query: unknown) => query is MJ,
  Model: MC
): M {
  if (!isModelURLParams(query))
    throw new APIError('Invalid request query', 400);
  return Model.fromURLParams(query);
}
