/**
 * Shared Composio SDK response types.
 *
 * The SDK uses generic types internally, so we define the shapes we rely on
 * in one place rather than re-declaring them across multiple files.
 */

/** Shape of items returned by composio.connectedAccounts.list(). */
export type ComposioAccountItem = {
  id: string;
  toolkit: { slug: string };
  status: string;
};
