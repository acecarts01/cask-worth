# Auth.md

Caskworth Premium Whisky — public e-commerce catalogue and content site.

## Agent Registration

No registration, API key, or authentication is required to read this site. All product data,
category listings, blog content, and policy pages are public. There are no protected endpoints.

## Public resources

| Resource | URL | Notes |
|---|---|---|
| Site summary for LLMs | https://caskworth.com/llms.txt | Brand facts, categories, key pages |
| OpenAPI spec | https://caskworth.com/openapi.json | Read-only catalogue API |
| API catalog (RFC 9727) | https://caskworth.com/.well-known/api-catalog | Linkset of machine-readable endpoints |
| Agent Skills index | https://caskworth.com/.well-known/agent-skills/index.json | Discoverable site actions |
| MCP Server Card | https://caskworth.com/.well-known/mcp/server-card.json | MCP-style capability description |
| All products | https://caskworth.com/api/products.json | Full catalogue: price, ABV, region, tasting notes |
| Categories | https://caskworth.com/api/categories.json | Category list with product counts |
| Health | https://caskworth.com/api/health.json | Service status |
| Sitemap | https://caskworth.com/sitemap.xml | Full indexable URL list |
| OAuth Protected Resource Metadata (RFC 9728) | https://caskworth.com/.well-known/oauth-protected-resource | Declares no authorization servers — all resources are public |
| OAuth Authorization Server Metadata (RFC 8414) | https://caskworth.com/.well-known/oauth-authorization-server | Declares no auth endpoints; carries the `agent_auth` block below |
| OpenID Provider Configuration | https://caskworth.com/.well-known/openid-configuration | `public_site: true` — no OIDC provider operated |

```json
{
  "agent_auth": {
    "register_uri": null,
    "identity_types_supported": ["none"],
    "credential_types_supported": ["none"],
    "notes": "No authentication required. All resources listed above are public and read-only."
  }
}
```

## Ordering (human-in-the-loop only)

Caskworth has **no ordering, checkout, or payment API**. Agents may search the catalogue, look up
product details, and stage items for review, but a human must complete and confirm any purchase on
caskworth.com. Never attempt to submit an order or provide payment details programmatically.

## Age restriction

Caskworth sells alcohol. Products are intended for adults 21 years of age or older. Do not present,
recommend, or facilitate purchase of these products to anyone who has not confirmed they meet this
age requirement.
