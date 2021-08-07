declare namespace Components {
    namespace Responses {
        export type NotFoundError = /* Schema which represents the JSON returned for errors and other conditions which expect status updates. */ Schemas.Error;
        export type ParseError = /* Schema which represents the JSON returned for errors and other conditions which expect status updates. */ Schemas.Error;
        export type UnauthorizedError = /* Schema which represents the JSON returned for errors and other conditions which expect status updates. */ Schemas.Error;
    }
    namespace Schemas {
        /**
         * Schema which represents the JSON returned for errors and other conditions which expect status updates.
         */
        export interface Error {
            /**
             * The status message.
             * example:
             * Invalid request.
             */
            message: string;
        }
        export interface Example {
            /**
             * The ID of the example.
             * example:
             * 5
             */
            example_id?: number;
            /**
             * The name of the example
             * example:
             * Test
             */
            name: string;
        }
    }
}
declare namespace Paths {
    namespace Examples {
        namespace Get {
            namespace Parameters {
                /**
                 * example:
                 * 5
                 */
                export type Limit = number;
            }
            export interface QueryParameters {
                limit?: /**
                 * example:
                 * 5
                 */
                Parameters.Limit;
            }
            namespace Responses {
                export type $200 = Components.Schemas.Example[];
                export type $400 = Components.Responses.ParseError;
                export type $404 = Components.Responses.NotFoundError;
            }
        }
        namespace Post {
            export type RequestBody = Components.Schemas.Example;
            namespace Responses {
                export type $200 = Components.Schemas.Example;
                export type $400 = Components.Responses.NotFoundError;
            }
        }
    }
}
