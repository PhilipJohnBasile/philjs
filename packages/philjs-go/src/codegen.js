/**
 * Go Code Generator for PhilJS
 *
 * Generates Go server code from PhilJS routes and server functions.
 */
import { existsSync } from 'node:fs';
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { join, dirname, basename, extname } from 'node:path';
/**
 * Generate Go server code from PhilJS configuration
 */
export async function generateGoCode(options) {
    const { srcDir, outDir, module, router = true, handlers = true, types = true, dbDriver = 'postgres', middleware = true, database = true, } = options;
    await mkdir(outDir, { recursive: true });
    // Scan for server functions
    const routes = await scanServerFunctions(srcDir);
    const parsedRoutes = await parseRouteTypes(srcDir, routes);
    if (middleware) {
        await generateMiddleware(outDir, module);
    }
    if (database) {
        await generateDatabaseHelper(outDir, module, dbDriver);
    }
    if (router) {
        await generateRouter(outDir, module, parsedRoutes);
    }
    if (handlers) {
        await generateHandlers(outDir, module, parsedRoutes);
    }
    if (types) {
        await generateTypes(outDir, module, parsedRoutes);
    }
    // Generate response helpers
    await generateResponseHelpers(outDir, module);
    // Generate go.mod if not exists
    const goModPath = join(outDir, 'go.mod');
    if (!existsSync(goModPath)) {
        await generateGoMod(outDir, module);
    }
}
/**
 * Scan directory for server functions
 */
async function scanServerFunctions(srcDir) {
    const routes = [];
    if (!existsSync(srcDir)) {
        return routes;
    }
    const files = await readdir(srcDir, { recursive: true });
    for (const file of files) {
        if (typeof file !== 'string')
            continue;
        const ext = extname(file);
        if (ext !== '.ts' && ext !== '.js')
            continue;
        const filePath = join(srcDir, file);
        const content = await readFile(filePath, 'utf-8');
        // Parse server function exports
        const matches = content.matchAll(/export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(/g);
        for (const match of matches) {
            const method = match[1];
            const routePath = fileToRoutePath(file);
            routes.push({
                method,
                path: routePath,
                handler: `${method}_${pathToHandlerName(routePath)}`,
            });
        }
    }
    return routes;
}
/**
 * Parse TypeScript types from route files to extract request/response shapes
 */
async function parseRouteTypes(srcDir, routes) {
    const parsedRoutes = [];
    for (const route of routes) {
        // Convert route path back to file path
        const filePath = routePathToFile(srcDir, route.path);
        let content = '';
        if (existsSync(filePath + '.ts')) {
            content = await readFile(filePath + '.ts', 'utf-8');
        }
        else if (existsSync(filePath + '.js')) {
            content = await readFile(filePath + '.js', 'utf-8');
        }
        else if (existsSync(join(filePath, 'index.ts'))) {
            content = await readFile(join(filePath, 'index.ts'), 'utf-8');
        }
        const parsed = parseRouteFile(content, route);
        parsedRoutes.push(parsed);
    }
    return parsedRoutes;
}
/**
 * Convert route path back to file path
 */
function routePathToFile(srcDir, routePath) {
    const converted = routePath
        .replace(/^\//, '')
        .replace(/:(\w+)/g, '[$1]');
    return join(srcDir, converted);
}
/**
 * Parse a single route file to extract type information
 */
function parseRouteFile(content, route) {
    const pathParams = extractPathParams(route.path);
    const resourceName = extractResourceName(route.path);
    // Try to extract interface/type definitions
    const requestFields = extractRequestFields(content, route.method);
    const queryFields = extractQueryFields(content);
    const responseFields = extractResponseFields(content, route.method, resourceName);
    // Determine if this is a list endpoint
    const isList = route.method === 'GET' && pathParams.length === 0;
    return {
        ...route,
        requestFields,
        queryFields,
        pathParams,
        responseFields,
        isList,
        resourceName,
    };
}
/**
 * Extract path parameters from route path
 */
function extractPathParams(path) {
    const matches = path.matchAll(/:(\w+)/g);
    return Array.from(matches, m => m[1]).filter((p) => p !== undefined);
}
/**
 * Extract resource name from route path
 */
function extractResourceName(path) {
    const parts = path.split('/').filter(Boolean);
    // Find the first non-parameter segment
    for (const part of parts) {
        if (!part.startsWith(':')) {
            // Singularize if needed (simple heuristic)
            const name = part.replace(/s$/, '');
            return capitalize(name);
        }
    }
    return 'Resource';
}
/**
 * Extract request body fields from TypeScript content
 */
function extractRequestFields(content, method) {
    const fields = [];
    // Look for request body type annotations
    const bodyMatch = content.match(/(?:interface|type)\s+(?:Create|Update|)?\w*Request\s*(?:=\s*)?{([^}]+)}/);
    if (bodyMatch) {
        const bodyContent = bodyMatch[1];
        const fieldMatches = bodyContent.matchAll(/(\w+)(\?)?:\s*([^;,\n]+)/g);
        for (const match of fieldMatches) {
            const [, name, optional, tsType] = match;
            fields.push(createFieldInfo(name, tsType.trim(), !!optional));
        }
    }
    else if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        // Default fields for write operations
        fields.push(createFieldInfo('name', 'string', false));
        if (method !== 'PATCH') {
            fields.push(createFieldInfo('email', 'string', true));
        }
    }
    return fields;
}
/**
 * Extract query parameter fields
 */
function extractQueryFields(content) {
    const fields = [];
    // Look for query params type
    const queryMatch = content.match(/(?:interface|type)\s+\w*Query(?:Params)?\s*(?:=\s*)?{([^}]+)}/);
    if (queryMatch) {
        const queryContent = queryMatch[1];
        const fieldMatches = queryContent.matchAll(/(\w+)(\?)?:\s*([^;,\n]+)/g);
        for (const match of fieldMatches) {
            const [, name, optional, tsType] = match;
            fields.push(createFieldInfo(name, tsType.trim(), !!optional));
        }
    }
    else {
        // Default query fields for list endpoints
        fields.push(createFieldInfo('page', 'number', true));
        fields.push(createFieldInfo('limit', 'number', true));
        fields.push(createFieldInfo('search', 'string', true));
        fields.push(createFieldInfo('sortBy', 'string', true));
        fields.push(createFieldInfo('sortOrder', 'string', true));
    }
    return fields;
}
/**
 * Extract response fields
 */
function extractResponseFields(content, method, resourceName) {
    const fields = [];
    // Look for response type
    const responseMatch = content.match(/(?:interface|type)\s+\w*Response\s*(?:=\s*)?{([^}]+)}/);
    if (responseMatch) {
        const responseContent = responseMatch[1];
        const fieldMatches = responseContent.matchAll(/(\w+)(\?)?:\s*([^;,\n]+)/g);
        for (const match of fieldMatches) {
            const [, name, optional, tsType] = match;
            fields.push(createFieldInfo(name, tsType.trim(), !!optional));
        }
    }
    else {
        // Default response fields
        fields.push(createFieldInfo('id', 'number', false));
        fields.push(createFieldInfo('name', 'string', false));
        fields.push(createFieldInfo('createdAt', 'Date', false));
        fields.push(createFieldInfo('updatedAt', 'Date', false));
    }
    return fields;
}
/**
 * Create field info with Go type mapping
 */
function createFieldInfo(name, tsType, isOptional) {
    const goName = toPascalCase(name);
    const goType = tsTypeToGoType(tsType, name, isOptional);
    const isID = name.toLowerCase() === 'id' || name.toLowerCase().endsWith('id');
    // Build validation tag
    let validateTag = '';
    if (!isOptional) {
        validateTag = 'required';
    }
    if (tsType === 'string' && !isOptional) {
        validateTag += validateTag ? ',min=1' : 'min=1';
    }
    if (name === 'email') {
        validateTag += validateTag ? ',email' : 'email';
    }
    if (name === 'url' || name.includes('Url')) {
        validateTag += validateTag ? ',url' : 'url';
    }
    return {
        name,
        goName,
        goType,
        jsonTag: name,
        validateTag,
        dbTag: toSnakeCase(name),
        isOptional,
        isID,
    };
}
/**
 * Convert TypeScript type to Go type
 */
function tsTypeToGoType(tsType, fieldName, isOptional) {
    const cleanType = tsType.replace(/\s/g, '');
    // Handle arrays
    if (cleanType.endsWith('[]')) {
        const elementType = cleanType.slice(0, -2);
        const goElementType = tsTypeToGoType(elementType, fieldName, false);
        return `[]${goElementType}`;
    }
    // Handle Array<T>
    const arrayMatch = cleanType.match(/^Array<(.+)>$/);
    if (arrayMatch) {
        const goElementType = tsTypeToGoType(arrayMatch[1], fieldName, false);
        return `[]${goElementType}`;
    }
    // Handle optional marker
    let baseType = cleanType;
    let pointer = isOptional ? '*' : '';
    // Map basic types
    const typeMap = {
        'string': 'string',
        'number': 'float64',
        'boolean': 'bool',
        'Date': 'time.Time',
        'any': 'interface{}',
        'unknown': 'interface{}',
        'object': 'map[string]interface{}',
        'null': 'interface{}',
        'undefined': 'interface{}',
        'void': '',
        'bigint': 'int64',
    };
    // Check for ID fields - use int64
    if (fieldName.toLowerCase() === 'id' || fieldName.toLowerCase().endsWith('id')) {
        if (baseType === 'number' || baseType === 'string') {
            return pointer + 'int64';
        }
    }
    if (typeMap[baseType]) {
        return pointer + typeMap[baseType];
    }
    // Handle Record<K, V>
    const recordMatch = baseType.match(/^Record<(\w+),\s*(\w+)>$/);
    if (recordMatch) {
        const keyType = tsTypeToGoType(recordMatch[1], '', false);
        const valueType = tsTypeToGoType(recordMatch[2], '', false);
        return `map[${keyType}]${valueType}`;
    }
    // Handle union types - use the first non-null type
    if (baseType.includes('|')) {
        const types = baseType.split('|').map(t => t.trim());
        const nonNullType = types.find(t => t !== 'null' && t !== 'undefined');
        if (nonNullType) {
            return '*' + tsTypeToGoType(nonNullType, fieldName, false);
        }
        return '*interface{}';
    }
    // Default to interface name (assume it's a custom type)
    return pointer + toPascalCase(baseType);
}
/**
 * Convert string to PascalCase
 */
function toPascalCase(s) {
    return s
        .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
        .replace(/^(\w)/, (_, c) => c.toUpperCase());
}
/**
 * Convert string to snake_case
 */
function toSnakeCase(s) {
    return s
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase()
        .replace(/^_/, '');
}
/**
 * Convert file path to route path
 */
function fileToRoutePath(file) {
    let route = file
        .replace(/\\/g, '/')
        .replace(/\.(ts|js)$/, '')
        .replace(/\/index$/, '')
        .replace(/\[([^\]]+)\]/g, ':$1'); // [id] -> :id
    if (!route.startsWith('/')) {
        route = '/' + route;
    }
    return route || '/';
}
/**
 * Convert path to Go handler name
 */
function pathToHandlerName(path) {
    return path
        .replace(/^\//, '')
        .replace(/\//g, '_')
        .replace(/:/g, '')
        .replace(/-/g, '_')
        || 'root';
}
/**
 * Generate Go router code
 */
async function generateRouter(outDir, module, routes) {
    const code = `// Code generated by @philjs/go. DO NOT EDIT.
package main

import (
	"${module}/handlers"
	"${module}/middleware"

	"github.com/philjs/philjs-go/server"
)

func RegisterRoutes(s *server.Server) {
	// Apply global middleware
	s.Use(middleware.Recovery())
	s.Use(middleware.Logger())
	s.Use(middleware.CORS())

	// API routes group with validation middleware
	api := s.Group("/api")
	api.Use(middleware.Validator())

${routes.map(r => `	api.${capitalize(r.method.toLowerCase())}("${r.path.replace(/^\/api/, '') || '/'}", handlers.${r.handler})`).join('\n')}
}
`;
    await writeFile(join(outDir, 'routes.go'), code);
}
/**
 * Generate Go handlers with full implementations
 */
async function generateHandlers(outDir, module, routes) {
    const handlersDir = join(outDir, 'handlers');
    await mkdir(handlersDir, { recursive: true });
    // Group routes by resource
    const routesByResource = new Map();
    for (const route of routes) {
        const existing = routesByResource.get(route.resourceName) || [];
        existing.push(route);
        routesByResource.set(route.resourceName, existing);
    }
    // Generate a handler file for each resource
    for (const [resourceName, resourceRoutes] of routesByResource) {
        const code = generateHandlerFile(module, resourceName, resourceRoutes);
        const fileName = `${resourceName.toLowerCase()}_handlers.go`;
        await writeFile(join(handlersDir, fileName), code);
    }
    // Generate the handlers index file
    const indexCode = generateHandlersIndex(module, routes);
    await writeFile(join(handlersDir, 'handlers.go'), indexCode);
}
/**
 * Generate handler file for a resource
 */
function generateHandlerFile(module, resourceName, routes) {
    // Check if we need strings package (for PATCH handlers)
    const needsStrings = routes.some(r => r.method === 'PATCH');
    const standardImports = [
        '"context"',
        '"database/sql"',
        '"encoding/json"',
        '"net/http"',
        '"strconv"',
        ...(needsStrings ? ['"strings"'] : []),
        '"time"',
    ];
    const externalImports = [
        `"${module}/db"`,
        `"${module}/response"`,
        `"${module}/types"`,
    ];
    const thirdPartyImports = [
        '"github.com/go-playground/validator/v10"',
    ];
    const handlers = routes.map(route => generateHandler(route, resourceName)).join('\n\n');
    const structs = generateRequestResponseStructs(routes, resourceName);
    return `// Code generated by @philjs/go. DO NOT EDIT.
package handlers

import (
${standardImports.map(i => `\t${i}`).join('\n')}

${externalImports.map(i => `\t${i}`).join('\n')}

${thirdPartyImports.map(i => `\t${i}`).join('\n')}
)

var validate = validator.New()

${structs}

${handlers}
`;
}
/**
 * Generate request/response structs for routes
 */
function generateRequestResponseStructs(routes, resourceName) {
    const structs = [];
    for (const route of routes) {
        const handlerName = toPascalCase(route.handler);
        // Request struct
        if (route.requestFields.length > 0) {
            const fields = route.requestFields.map(f => {
                const tags = buildStructTags(f);
                return `\t${f.goName} ${f.goType} ${tags}`;
            });
            structs.push(`// ${handlerName}Request represents the request body for ${route.method} ${route.path}
type ${handlerName}Request struct {
${fields.join('\n')}
}`);
        }
        // Query params struct for GET requests
        if (route.method === 'GET' && route.queryFields.length > 0) {
            const fields = route.queryFields.map(f => {
                const tags = buildStructTags(f, true);
                return `\t${f.goName} ${f.goType} ${tags}`;
            });
            structs.push(`// ${handlerName}Query represents query parameters for ${route.method} ${route.path}
type ${handlerName}Query struct {
${fields.join('\n')}
}`);
        }
        // Response struct
        if (route.responseFields.length > 0) {
            const fields = route.responseFields.map(f => {
                const tags = buildStructTags(f);
                return `\t${f.goName} ${f.goType} ${tags}`;
            });
            structs.push(`// ${handlerName}Response represents the response for ${route.method} ${route.path}
type ${handlerName}Response struct {
${fields.join('\n')}
}`);
        }
    }
    return structs.join('\n\n');
}
/**
 * Build struct tags for a field
 */
function buildStructTags(field, isQuery = false) {
    const tags = [];
    // JSON tag
    const jsonOmit = field.isOptional ? ',omitempty' : '';
    tags.push(`json:"${field.jsonTag}${jsonOmit}"`);
    // Validation tag
    if (field.validateTag) {
        tags.push(`validate:"${field.validateTag}"`);
    }
    // DB tag
    tags.push(`db:"${field.dbTag}"`);
    // Form tag for query params
    if (isQuery) {
        tags.push(`form:"${field.jsonTag}"`);
    }
    return '`' + tags.join(' ') + '`';
}
/**
 * Generate a single handler function
 */
function generateHandler(route, resourceName) {
    const handlerName = toPascalCase(route.handler);
    const tableName = toSnakeCase(resourceName) + 's';
    switch (route.method) {
        case 'GET':
            if (route.pathParams.length > 0) {
                return generateGetOneHandler(route, handlerName, tableName, resourceName);
            }
            return generateGetListHandler(route, handlerName, tableName, resourceName);
        case 'POST':
            return generateCreateHandler(route, handlerName, tableName, resourceName);
        case 'PUT':
            return generateUpdateHandler(route, handlerName, tableName, resourceName);
        case 'PATCH':
            return generatePatchHandler(route, handlerName, tableName, resourceName);
        case 'DELETE':
            return generateDeleteHandler(route, handlerName, tableName, resourceName);
        default:
            return generateGenericHandler(route, handlerName);
    }
}
/**
 * Generate GET single resource handler
 */
function generateGetOneHandler(route, handlerName, tableName, resourceName) {
    const idParam = route.pathParams[0] || 'id';
    return `// ${handlerName} handles ${route.method} ${route.path}
func ${handlerName}(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Parse path parameter
	${idParam}Str := r.PathValue("${idParam}")
	${idParam}, err := strconv.ParseInt(${idParam}Str, 10, 64)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid ${idParam} format")
		return
	}

	// Query database
	var result ${handlerName}Response
	query := \`SELECT * FROM ${tableName} WHERE ${toSnakeCase(idParam)} = $1\`

	err = db.Get().GetContext(ctx, &result, query, ${idParam})
	if err != nil {
		if err == sql.ErrNoRows {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "${resourceName} not found")
			return
		}
		response.Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to fetch ${resourceName.toLowerCase()}")
		return
	}

	response.JSON(w, http.StatusOK, result)
}`;
}
/**
 * Generate GET list handler
 */
function generateGetListHandler(route, handlerName, tableName, resourceName) {
    return `// ${handlerName} handles ${route.method} ${route.path}
func ${handlerName}(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Parse query parameters
	query := ${handlerName}Query{
		Page:      1,
		Limit:     20,
		SortBy:    "created_at",
		SortOrder: "desc",
	}

	if pageStr := r.URL.Query().Get("page"); pageStr != "" {
		if page, err := strconv.ParseInt(pageStr, 10, 64); err == nil && page > 0 {
			query.Page = page
		}
	}

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if limit, err := strconv.ParseInt(limitStr, 10, 64); err == nil && limit > 0 && limit <= 100 {
			query.Limit = limit
		}
	}

	if search := r.URL.Query().Get("search"); search != "" {
		query.Search = &search
	}

	if sortBy := r.URL.Query().Get("sortBy"); sortBy != "" {
		query.SortBy = sortBy
	}

	if sortOrder := r.URL.Query().Get("sortOrder"); sortOrder != "" {
		query.SortOrder = sortOrder
	}

	// Validate query params
	if err := validate.Struct(query); err != nil {
		response.ValidationError(w, err)
		return
	}

	// Build query
	offset := (query.Page - 1) * query.Limit
	sqlQuery := \`
		SELECT * FROM ${tableName}
		WHERE ($1::text IS NULL OR name ILIKE '%' || $1 || '%')
		ORDER BY \` + query.SortBy + \` \` + query.SortOrder + \`
		LIMIT $2 OFFSET $3
	\`

	var results []${handlerName}Response
	var searchParam interface{} = nil
	if query.Search != nil {
		searchParam = *query.Search
	}

	err := db.Get().SelectContext(ctx, &results, sqlQuery, searchParam, query.Limit, offset)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to fetch ${resourceName.toLowerCase()}s")
		return
	}

	// Get total count
	var total int64
	countQuery := \`SELECT COUNT(*) FROM ${tableName} WHERE ($1::text IS NULL OR name ILIKE '%' || $1 || '%')\`
	err = db.Get().GetContext(ctx, &total, countQuery, searchParam)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to count ${resourceName.toLowerCase()}s")
		return
	}

	response.JSONWithMeta(w, http.StatusOK, results, map[string]interface{}{
		"page":       query.Page,
		"limit":      query.Limit,
		"total":      total,
		"totalPages": (total + query.Limit - 1) / query.Limit,
	})
}`;
}
/**
 * Generate POST create handler
 */
function generateCreateHandler(route, handlerName, tableName, resourceName) {
    const insertFields = route.requestFields.map(f => f.dbTag);
    const insertPlaceholders = route.requestFields.map((_, i) => `$${i + 1}`);
    const insertValues = route.requestFields.map(f => `req.${f.goName}`);
    return `// ${handlerName} handles ${route.method} ${route.path}
func ${handlerName}(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Parse request body
	var req ${handlerName}Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_JSON", "Invalid request body")
		return
	}

	// Validate request
	if err := validate.Struct(req); err != nil {
		response.ValidationError(w, err)
		return
	}

	// Insert into database
	query := \`
		INSERT INTO ${tableName} (${insertFields.join(', ')}, created_at, updated_at)
		VALUES (${insertPlaceholders.join(', ')}, NOW(), NOW())
		RETURNING *
	\`

	var result ${handlerName}Response
	err := db.Get().GetContext(ctx, &result, query, ${insertValues.join(', ')})
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to create ${resourceName.toLowerCase()}")
		return
	}

	response.JSON(w, http.StatusCreated, result)
}`;
}
/**
 * Generate PUT update handler
 */
function generateUpdateHandler(route, handlerName, tableName, resourceName) {
    const idParam = route.pathParams[0] || 'id';
    const updateSets = route.requestFields.map((f, i) => `${f.dbTag} = $${i + 2}`);
    return `// ${handlerName} handles ${route.method} ${route.path}
func ${handlerName}(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Parse path parameter
	${idParam}Str := r.PathValue("${idParam}")
	${idParam}, err := strconv.ParseInt(${idParam}Str, 10, 64)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid ${idParam} format")
		return
	}

	// Parse request body
	var req ${handlerName}Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_JSON", "Invalid request body")
		return
	}

	// Validate request
	if err := validate.Struct(req); err != nil {
		response.ValidationError(w, err)
		return
	}

	// Update database
	query := \`
		UPDATE ${tableName}
		SET ${updateSets.join(', ')}, updated_at = NOW()
		WHERE ${toSnakeCase(idParam)} = $1
		RETURNING *
	\`

	var result ${handlerName}Response
	err = db.Get().GetContext(ctx, &result, query, ${idParam}${route.requestFields.map(f => `, req.${f.goName}`).join('')})
	if err != nil {
		if err == sql.ErrNoRows {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "${resourceName} not found")
			return
		}
		response.Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to update ${resourceName.toLowerCase()}")
		return
	}

	response.JSON(w, http.StatusOK, result)
}`;
}
/**
 * Generate PATCH partial update handler
 */
function generatePatchHandler(route, handlerName, tableName, resourceName) {
    const idParam = route.pathParams[0] || 'id';
    // Build field to DB column mapping
    const fieldMappings = route.requestFields.map(f => `\t\t"${f.jsonTag}": "${f.dbTag}",`).join('\n');
    return `// ${handlerName} handles ${route.method} ${route.path}
func ${handlerName}(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Parse path parameter
	${idParam}Str := r.PathValue("${idParam}")
	${idParam}, err := strconv.ParseInt(${idParam}Str, 10, 64)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid ${idParam} format")
		return
	}

	// Parse request body as map for partial updates
	var updates map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_JSON", "Invalid request body")
		return
	}

	if len(updates) == 0 {
		response.Error(w, http.StatusBadRequest, "EMPTY_UPDATE", "No fields to update")
		return
	}

	// Map JSON field names to database column names
	fieldToColumn := map[string]string{
${fieldMappings}
	}

	setClauses := []string{}
	args := []interface{}{${idParam}}
	argIndex := 2

	for field, value := range updates {
		dbColumn, allowed := fieldToColumn[field]
		if !allowed {
			continue
		}
		setClauses = append(setClauses, dbColumn + " = $" + strconv.Itoa(argIndex))
		args = append(args, value)
		argIndex++
	}

	if len(setClauses) == 0 {
		response.Error(w, http.StatusBadRequest, "NO_VALID_FIELDS", "No valid fields to update")
		return
	}

	query := "UPDATE ${tableName} SET " + strings.Join(setClauses, ", ") + ", updated_at = NOW() WHERE ${toSnakeCase(idParam)} = $1 RETURNING *"

	var result ${handlerName}Response
	err = db.Get().GetContext(ctx, &result, query, args...)
	if err != nil {
		if err == sql.ErrNoRows {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "${resourceName} not found")
			return
		}
		response.Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to update ${resourceName.toLowerCase()}")
		return
	}

	response.JSON(w, http.StatusOK, result)
}`;
}
/**
 * Generate DELETE handler
 */
function generateDeleteHandler(route, handlerName, tableName, resourceName) {
    const idParam = route.pathParams[0] || 'id';
    return `// ${handlerName} handles ${route.method} ${route.path}
func ${handlerName}(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Parse path parameter
	${idParam}Str := r.PathValue("${idParam}")
	${idParam}, err := strconv.ParseInt(${idParam}Str, 10, 64)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid ${idParam} format")
		return
	}

	// Delete from database
	query := \`DELETE FROM ${tableName} WHERE ${toSnakeCase(idParam)} = $1\`

	result, err := db.Get().ExecContext(ctx, query, ${idParam})
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to delete ${resourceName.toLowerCase()}")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to verify deletion")
		return
	}

	if rowsAffected == 0 {
		response.Error(w, http.StatusNotFound, "NOT_FOUND", "${resourceName} not found")
		return
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"deleted": true,
		"id":      ${idParam},
	})
}`;
}
/**
 * Generate generic handler for unrecognized methods
 */
function generateGenericHandler(route, handlerName) {
    return `// ${handlerName} handles ${route.method} ${route.path}
func ${handlerName}(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, http.StatusOK, map[string]interface{}{
		"method": "${route.method}",
		"path":   "${route.path}",
	})
}`;
}
/**
 * Generate handlers index file
 */
function generateHandlersIndex(module, routes) {
    return `// Code generated by @philjs/go. DO NOT EDIT.
package handlers

// This package contains HTTP handlers for all API routes.
// Each resource has its own handler file with full implementations.
//
// Available handlers:
${routes.map(r => `//   - ${r.handler}: ${r.method} ${r.path}`).join('\n')}
`;
}
/**
 * Generate Go types from TypeScript
 */
async function generateTypes(outDir, module, routes) {
    const typesDir = join(outDir, 'types');
    await mkdir(typesDir, { recursive: true });
    // Extract unique resource types from routes
    const resourceTypes = new Map();
    for (const route of routes) {
        if (!resourceTypes.has(route.resourceName)) {
            resourceTypes.set(route.resourceName, route.responseFields);
        }
    }
    // Generate resource model structs
    const modelStructs = Array.from(resourceTypes.entries()).map(([name, fields]) => {
        const fieldDefs = fields.map(f => {
            const tags = buildStructTags(f);
            return `\t${f.goName} ${f.goType} ${tags}`;
        });
        return `// ${name} represents a ${name.toLowerCase()} entity
type ${name} struct {
${fieldDefs.join('\n')}
}`;
    }).join('\n\n');
    const code = `// Code generated by @philjs/go. DO NOT EDIT.
package types

import "time"

// Request represents an incoming HTTP request
type Request struct {
	Method  string            \`json:"method"\`
	URL     string            \`json:"url"\`
	Headers map[string]string \`json:"headers"\`
	Body    interface{}       \`json:"body,omitempty"\`
	Params  map[string]string \`json:"params,omitempty"\`
	Query   map[string]string \`json:"query,omitempty"\`
}

// Response represents an HTTP response
type Response struct {
	Status  int               \`json:"status"\`
	Headers map[string]string \`json:"headers,omitempty"\`
	Body    interface{}       \`json:"body,omitempty"\`
}

// SSRResult represents the result of server-side rendering
type SSRResult struct {
	HTML    string      \`json:"html"\`
	Head    string      \`json:"head"\`
	Scripts []string    \`json:"scripts"\`
	Styles  []string    \`json:"styles"\`
	State   interface{} \`json:"state,omitempty"\`
}

// APIError represents an API error response
type APIError struct {
	Code    string      \`json:"code"\`
	Message string      \`json:"message"\`
	Details interface{} \`json:"details,omitempty"\`
}

// ValidationError represents a validation error
type ValidationError struct {
	Field   string \`json:"field"\`
	Message string \`json:"message"\`
	Tag     string \`json:"tag"\`
	Value   string \`json:"value,omitempty"\`
}

// PaginatedResponse represents a paginated list response
type PaginatedResponse[T any] struct {
	Data       []T                    \`json:"data"\`
	Pagination PaginationMeta         \`json:"pagination"\`
	Meta       map[string]interface{} \`json:"meta,omitempty"\`
}

// PaginationMeta contains pagination metadata
type PaginationMeta struct {
	Page       int64 \`json:"page"\`
	Limit      int64 \`json:"limit"\`
	Total      int64 \`json:"total"\`
	TotalPages int64 \`json:"totalPages"\`
}

// SuccessResponse represents a generic success response
type SuccessResponse struct {
	Success bool        \`json:"success"\`
	Message string      \`json:"message,omitempty"\`
	Data    interface{} \`json:"data,omitempty"\`
}

// DeleteResponse represents a delete operation response
type DeleteResponse struct {
	Deleted bool  \`json:"deleted"\`
	ID      int64 \`json:"id"\`
}

// Resource Models
${modelStructs}
`;
    await writeFile(join(typesDir, 'types.go'), code);
}
/**
 * Generate middleware package
 */
async function generateMiddleware(outDir, module) {
    const middlewareDir = join(outDir, 'middleware');
    await mkdir(middlewareDir, { recursive: true });
    // Recovery middleware
    const recoveryCode = `// Code generated by @philjs/go. DO NOT EDIT.
package middleware

import (
	"fmt"
	"log"
	"net/http"
	"runtime/debug"

	"${module}/response"
)

// Recovery returns a middleware that recovers from panics
func Recovery() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if err := recover(); err != nil {
					// Log the stack trace
					log.Printf("PANIC: %v\\n%s", err, debug.Stack())

					// Return 500 error
					response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "An internal error occurred")
				}
			}()

			next.ServeHTTP(w, r)
		})
	}
}
`;
    // Logger middleware
    const loggerCode = `// Code generated by @philjs/go. DO NOT EDIT.
package middleware

import (
	"log"
	"net/http"
	"time"
)

// responseWriter wraps http.ResponseWriter to capture status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

// Logger returns a middleware that logs HTTP requests
func Logger() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			// Wrap response writer to capture status code
			wrapped := &responseWriter{
				ResponseWriter: w,
				statusCode:     http.StatusOK,
			}

			// Process request
			next.ServeHTTP(wrapped, r)

			// Log request
			duration := time.Since(start)
			log.Printf(
				"%s %s %d %s %s",
				r.Method,
				r.URL.Path,
				wrapped.statusCode,
				duration,
				r.RemoteAddr,
			)
		})
	}
}
`;
    // CORS middleware
    const corsCode = `// Code generated by @philjs/go. DO NOT EDIT.
package middleware

import (
	"net/http"
	"os"
	"strings"
)

// CORS returns a middleware that handles CORS
func CORS() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get allowed origins from env or default to *
			allowedOrigins := os.Getenv("CORS_ORIGINS")
			if allowedOrigins == "" {
				allowedOrigins = "*"
			}

			// Get allowed methods from env or default
			allowedMethods := os.Getenv("CORS_METHODS")
			if allowedMethods == "" {
				allowedMethods = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
			}

			// Get allowed headers from env or default
			allowedHeaders := os.Getenv("CORS_HEADERS")
			if allowedHeaders == "" {
				allowedHeaders = "Content-Type, Authorization, X-Request-ID"
			}

			origin := r.Header.Get("Origin")
			if origin != "" {
				// Check if origin is allowed
				if allowedOrigins == "*" {
					w.Header().Set("Access-Control-Allow-Origin", origin)
				} else {
					for _, allowed := range strings.Split(allowedOrigins, ",") {
						if strings.TrimSpace(allowed) == origin {
							w.Header().Set("Access-Control-Allow-Origin", origin)
							break
						}
					}
				}
			}

			w.Header().Set("Access-Control-Allow-Methods", allowedMethods)
			w.Header().Set("Access-Control-Allow-Headers", allowedHeaders)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Max-Age", "86400")

			// Handle preflight requests
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
`;
    // Validator middleware
    const validatorCode = `// Code generated by @philjs/go. DO NOT EDIT.
package middleware

import (
	"net/http"

	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

// GetValidator returns the validator instance
func GetValidator() *validator.Validate {
	return validate
}

// Validator returns a middleware that sets up validation
func Validator() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Validator is available via GetValidator() in handlers
			next.ServeHTTP(w, r)
		})
	}
}

// ValidateStruct validates a struct using the validator
func ValidateStruct(s interface{}) error {
	return validate.Struct(s)
}
`;
    // Request ID middleware
    const requestIDCode = `// Code generated by @philjs/go. DO NOT EDIT.
package middleware

import (
	"context"
	"net/http"

	"github.com/google/uuid"
)

type contextKey string

const RequestIDKey contextKey = "request_id"

// RequestID returns a middleware that adds a request ID to each request
func RequestID() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Check for existing request ID header
			requestID := r.Header.Get("X-Request-ID")
			if requestID == "" {
				requestID = uuid.New().String()
			}

			// Add to response header
			w.Header().Set("X-Request-ID", requestID)

			// Add to context
			ctx := context.WithValue(r.Context(), RequestIDKey, requestID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetRequestID retrieves the request ID from context
func GetRequestID(ctx context.Context) string {
	if id, ok := ctx.Value(RequestIDKey).(string); ok {
		return id
	}
	return ""
}
`;
    // Rate limiter middleware
    const rateLimiterCode = `// Code generated by @philjs/go. DO NOT EDIT.
package middleware

import (
	"net/http"
	"sync"
	"time"

	"${module}/response"
)

// RateLimiter implements a simple token bucket rate limiter
type RateLimiter struct {
	mu       sync.Mutex
	clients  map[string]*clientLimiter
	rate     int           // tokens per interval
	interval time.Duration // refill interval
	burst    int           // max tokens
}

type clientLimiter struct {
	tokens     int
	lastRefill time.Time
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(rate int, interval time.Duration, burst int) *RateLimiter {
	return &RateLimiter{
		clients:  make(map[string]*clientLimiter),
		rate:     rate,
		interval: interval,
		burst:    burst,
	}
}

// RateLimit returns a rate limiting middleware
func RateLimit(rate int, interval time.Duration, burst int) func(http.Handler) http.Handler {
	limiter := NewRateLimiter(rate, interval, burst)

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			clientIP := r.RemoteAddr

			if !limiter.Allow(clientIP) {
				response.Error(w, http.StatusTooManyRequests, "RATE_LIMITED", "Too many requests")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// Allow checks if a request from the given client should be allowed
func (rl *RateLimiter) Allow(clientID string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()

	client, exists := rl.clients[clientID]
	if !exists {
		client = &clientLimiter{
			tokens:     rl.burst,
			lastRefill: now,
		}
		rl.clients[clientID] = client
	}

	// Refill tokens based on elapsed time
	elapsed := now.Sub(client.lastRefill)
	tokensToAdd := int(elapsed / rl.interval) * rl.rate
	if tokensToAdd > 0 {
		client.tokens = min(rl.burst, client.tokens+tokensToAdd)
		client.lastRefill = now
	}

	// Check if request is allowed
	if client.tokens > 0 {
		client.tokens--
		return true
	}

	return false
}
`;
    // Write all middleware files
    await Promise.all([
        writeFile(join(middlewareDir, 'recovery.go'), recoveryCode),
        writeFile(join(middlewareDir, 'logger.go'), loggerCode),
        writeFile(join(middlewareDir, 'cors.go'), corsCode),
        writeFile(join(middlewareDir, 'validator.go'), validatorCode),
        writeFile(join(middlewareDir, 'request_id.go'), requestIDCode),
        writeFile(join(middlewareDir, 'rate_limiter.go'), rateLimiterCode),
    ]);
}
/**
 * Generate database helper package
 */
async function generateDatabaseHelper(outDir, module, driver) {
    const dbDir = join(outDir, 'db');
    await mkdir(dbDir, { recursive: true });
    const driverImport = {
        postgres: '"github.com/lib/pq"',
        mysql: '"github.com/go-sql-driver/mysql"',
        sqlite: '"github.com/mattn/go-sqlite3"',
    }[driver];
    const driverName = {
        postgres: 'postgres',
        mysql: 'mysql',
        sqlite: 'sqlite3',
    }[driver];
    const code = `// Code generated by @philjs/go. DO NOT EDIT.
package db

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	"github.com/jmoiron/sqlx"
	_ ${driverImport}
)

var (
	instance *sqlx.DB
	once     sync.Once
)

// Config holds database configuration
type Config struct {
	Host            string
	Port            int
	User            string
	Password        string
	Database        string
	SSLMode         string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
	ConnMaxIdleTime time.Duration
}

// DefaultConfig returns default database configuration from environment
func DefaultConfig() Config {
	return Config{
		Host:            getEnv("DB_HOST", "localhost"),
		Port:            getEnvInt("DB_PORT", 5432),
		User:            getEnv("DB_USER", "postgres"),
		Password:        getEnv("DB_PASSWORD", ""),
		Database:        getEnv("DB_NAME", "app"),
		SSLMode:         getEnv("DB_SSLMODE", "disable"),
		MaxOpenConns:    getEnvInt("DB_MAX_OPEN_CONNS", 25),
		MaxIdleConns:    getEnvInt("DB_MAX_IDLE_CONNS", 5),
		ConnMaxLifetime: time.Duration(getEnvInt("DB_CONN_MAX_LIFETIME", 300)) * time.Second,
		ConnMaxIdleTime: time.Duration(getEnvInt("DB_CONN_MAX_IDLE_TIME", 30)) * time.Second,
	}
}

// Init initializes the database connection
func Init(cfg Config) error {
	var err error
	once.Do(func() {
		dsn := buildDSN(cfg)
		instance, err = sqlx.Connect("${driverName}", dsn)
		if err != nil {
			return
		}

		// Configure connection pool
		instance.SetMaxOpenConns(cfg.MaxOpenConns)
		instance.SetMaxIdleConns(cfg.MaxIdleConns)
		instance.SetConnMaxLifetime(cfg.ConnMaxLifetime)
		instance.SetConnMaxIdleTime(cfg.ConnMaxIdleTime)

		// Test connection
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		err = instance.PingContext(ctx)
		if err != nil {
			return
		}

		log.Println("Database connection established")
	})

	return err
}

// Get returns the database instance
func Get() *sqlx.DB {
	if instance == nil {
		if err := Init(DefaultConfig()); err != nil {
			log.Fatalf("Failed to initialize database: %v", err)
		}
	}
	return instance
}

// Close closes the database connection
func Close() error {
	if instance != nil {
		return instance.Close()
	}
	return nil
}

// Transaction executes a function within a database transaction
func Transaction(ctx context.Context, fn func(*sqlx.Tx) error) error {
	tx, err := Get().BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}

	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
		}
	}()

	if err := fn(tx); err != nil {
		if rbErr := tx.Rollback(); rbErr != nil {
			return fmt.Errorf("rollback failed: %v (original error: %w)", rbErr, err)
		}
		return err
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit transaction: %w", err)
	}

	return nil
}

// buildDSN builds the connection string for ${driver}
func buildDSN(cfg Config) string {
${generateDSNBuilder(driver)}
}

// Helper functions
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		var i int
		if _, err := fmt.Sscanf(value, "%d", &i); err == nil {
			return i
		}
	}
	return defaultValue
}
`;
    await writeFile(join(dbDir, 'db.go'), code);
    // Generate query helpers
    const queryHelpersCode = `// Code generated by @philjs/go. DO NOT EDIT.
package db

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/jmoiron/sqlx"
)

// QueryBuilder helps build SQL queries dynamically
type QueryBuilder struct {
	table      string
	columns    []string
	conditions []string
	args       []interface{}
	orderBy    string
	limit      int64
	offset     int64
}

// NewQueryBuilder creates a new query builder for a table
func NewQueryBuilder(table string) *QueryBuilder {
	return &QueryBuilder{
		table:   table,
		columns: []string{"*"},
	}
}

// Select sets the columns to select
func (qb *QueryBuilder) Select(columns ...string) *QueryBuilder {
	qb.columns = columns
	return qb
}

// Where adds a WHERE condition
func (qb *QueryBuilder) Where(condition string, args ...interface{}) *QueryBuilder {
	qb.conditions = append(qb.conditions, condition)
	qb.args = append(qb.args, args...)
	return qb
}

// OrderBy sets the ORDER BY clause
func (qb *QueryBuilder) OrderBy(orderBy string) *QueryBuilder {
	qb.orderBy = orderBy
	return qb
}

// Limit sets the LIMIT clause
func (qb *QueryBuilder) Limit(limit int64) *QueryBuilder {
	qb.limit = limit
	return qb
}

// Offset sets the OFFSET clause
func (qb *QueryBuilder) Offset(offset int64) *QueryBuilder {
	qb.offset = offset
	return qb
}

// Build builds the SQL query
func (qb *QueryBuilder) Build() (string, []interface{}) {
	var sb strings.Builder

	sb.WriteString("SELECT ")
	sb.WriteString(strings.Join(qb.columns, ", "))
	sb.WriteString(" FROM ")
	sb.WriteString(qb.table)

	if len(qb.conditions) > 0 {
		sb.WriteString(" WHERE ")
		sb.WriteString(strings.Join(qb.conditions, " AND "))
	}

	if qb.orderBy != "" {
		sb.WriteString(" ORDER BY ")
		sb.WriteString(qb.orderBy)
	}

	if qb.limit > 0 {
		sb.WriteString(fmt.Sprintf(" LIMIT %d", qb.limit))
	}

	if qb.offset > 0 {
		sb.WriteString(fmt.Sprintf(" OFFSET %d", qb.offset))
	}

	return sb.String(), qb.args
}

// GetOne executes the query and scans into a single result
func (qb *QueryBuilder) GetOne(ctx context.Context, dest interface{}) error {
	query, args := qb.Build()
	return Get().GetContext(ctx, dest, query, args...)
}

// GetAll executes the query and scans into a slice
func (qb *QueryBuilder) GetAll(ctx context.Context, dest interface{}) error {
	query, args := qb.Build()
	return Get().SelectContext(ctx, dest, query, args...)
}

// Count returns the count of matching rows
func (qb *QueryBuilder) Count(ctx context.Context) (int64, error) {
	originalColumns := qb.columns
	qb.columns = []string{"COUNT(*)"}

	query, args := qb.Build()
	qb.columns = originalColumns

	var count int64
	err := Get().GetContext(ctx, &count, query, args...)
	return count, err
}

// Exists checks if any matching rows exist
func (qb *QueryBuilder) Exists(ctx context.Context) (bool, error) {
	count, err := qb.Count(ctx)
	return count > 0, err
}
`;
    await writeFile(join(dbDir, 'query_builder.go'), queryHelpersCode);
}
/**
 * Generate DSN builder code based on driver
 */
function generateDSNBuilder(driver) {
    switch (driver) {
        case 'postgres':
            return `	return fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.Database, cfg.SSLMode,
	)`;
        case 'mysql':
            return `	return fmt.Sprintf(
		"%s:%s@tcp(%s:%d)/%s?parseTime=true",
		cfg.User, cfg.Password, cfg.Host, cfg.Port, cfg.Database,
	)`;
        case 'sqlite':
            return `	return cfg.Database`;
    }
}
/**
 * Generate response helpers package
 */
async function generateResponseHelpers(outDir, module) {
    const responseDir = join(outDir, 'response');
    await mkdir(responseDir, { recursive: true });
    const code = `// Code generated by @philjs/go. DO NOT EDIT.
package response

import (
	"encoding/json"
	"net/http"

	"github.com/go-playground/validator/v10"

	"${module}/types"
)

// JSON sends a JSON response with the given status code
func JSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)

	if data != nil {
		if err := json.NewEncoder(w).Encode(data); err != nil {
			// Log error but don't try to write again
			_ = err
		}
	}
}

// JSONWithMeta sends a JSON response with metadata (for paginated responses)
func JSONWithMeta(w http.ResponseWriter, status int, data interface{}, meta map[string]interface{}) {
	response := map[string]interface{}{
		"data": data,
		"meta": meta,
	}
	JSON(w, status, response)
}

// Error sends an error response
func Error(w http.ResponseWriter, status int, code string, message string) {
	JSON(w, status, types.APIError{
		Code:    code,
		Message: message,
	})
}

// ErrorWithDetails sends an error response with additional details
func ErrorWithDetails(w http.ResponseWriter, status int, code string, message string, details interface{}) {
	JSON(w, status, types.APIError{
		Code:    code,
		Message: message,
		Details: details,
	})
}

// ValidationError sends a validation error response
func ValidationError(w http.ResponseWriter, err error) {
	var validationErrors []types.ValidationError

	if ve, ok := err.(validator.ValidationErrors); ok {
		for _, fe := range ve {
			validationErrors = append(validationErrors, types.ValidationError{
				Field:   fe.Field(),
				Message: formatValidationMessage(fe),
				Tag:     fe.Tag(),
				Value:   fe.Param(),
			})
		}
	} else {
		validationErrors = append(validationErrors, types.ValidationError{
			Field:   "unknown",
			Message: err.Error(),
		})
	}

	ErrorWithDetails(w, http.StatusBadRequest, "VALIDATION_ERROR", "Validation failed", validationErrors)
}

// formatValidationMessage formats a validation error into a human-readable message
func formatValidationMessage(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return fe.Field() + " is required"
	case "email":
		return fe.Field() + " must be a valid email address"
	case "min":
		return fe.Field() + " must be at least " + fe.Param() + " characters"
	case "max":
		return fe.Field() + " must be at most " + fe.Param() + " characters"
	case "url":
		return fe.Field() + " must be a valid URL"
	case "gte":
		return fe.Field() + " must be greater than or equal to " + fe.Param()
	case "lte":
		return fe.Field() + " must be less than or equal to " + fe.Param()
	case "oneof":
		return fe.Field() + " must be one of: " + fe.Param()
	default:
		return fe.Field() + " failed validation: " + fe.Tag()
	}
}

// Success sends a success response
func Success(w http.ResponseWriter, message string) {
	JSON(w, http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: message,
	})
}

// SuccessWithData sends a success response with data
func SuccessWithData(w http.ResponseWriter, message string, data interface{}) {
	JSON(w, http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// Created sends a 201 Created response
func Created(w http.ResponseWriter, data interface{}) {
	JSON(w, http.StatusCreated, data)
}

// NoContent sends a 204 No Content response
func NoContent(w http.ResponseWriter) {
	w.WriteHeader(http.StatusNoContent)
}

// NotFound sends a 404 Not Found response
func NotFound(w http.ResponseWriter, message string) {
	Error(w, http.StatusNotFound, "NOT_FOUND", message)
}

// Unauthorized sends a 401 Unauthorized response
func Unauthorized(w http.ResponseWriter, message string) {
	Error(w, http.StatusUnauthorized, "UNAUTHORIZED", message)
}

// Forbidden sends a 403 Forbidden response
func Forbidden(w http.ResponseWriter, message string) {
	Error(w, http.StatusForbidden, "FORBIDDEN", message)
}

// BadRequest sends a 400 Bad Request response
func BadRequest(w http.ResponseWriter, message string) {
	Error(w, http.StatusBadRequest, "BAD_REQUEST", message)
}

// InternalError sends a 500 Internal Server Error response
func InternalError(w http.ResponseWriter, message string) {
	Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", message)
}
`;
    await writeFile(join(responseDir, 'response.go'), code);
}
/**
 * Generate go.mod file
 */
async function generateGoMod(outDir, module) {
    const code = `module ${module}

go 1.22

require (
	github.com/go-playground/validator/v10 v10.19.0
	github.com/google/uuid v1.6.0
	github.com/jmoiron/sqlx v1.3.5
	github.com/lib/pq v1.10.9
	github.com/philjs/philjs-go v0.1.0
)

require (
	github.com/gabriel-vasile/mimetype v1.4.3 // indirect
	github.com/go-playground/locales v0.14.1 // indirect
	github.com/go-playground/universal-translator v0.18.1 // indirect
	github.com/leodido/go-urn v1.4.0 // indirect
	golang.org/x/crypto v0.21.0 // indirect
	golang.org/x/net v0.22.0 // indirect
	golang.org/x/sys v0.18.0 // indirect
	golang.org/x/text v0.14.0 // indirect
)
`;
    await writeFile(join(outDir, 'go.mod'), code);
}
function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
/**
 * Watch for changes and regenerate code
 */
export async function watchAndGenerate(options) {
    const { watch } = await import('node:fs');
    console.log(`Watching ${options.srcDir} for changes...`);
    watch(options.srcDir, { recursive: true }, async (event, filename) => {
        if (!filename)
            return;
        const ext = extname(filename);
        if (ext !== '.ts' && ext !== '.js')
            return;
        console.log(`Detected change in ${filename}, regenerating...`);
        await generateGoCode(options);
    });
    // Initial generation
    await generateGoCode(options);
}
//# sourceMappingURL=codegen.js.map