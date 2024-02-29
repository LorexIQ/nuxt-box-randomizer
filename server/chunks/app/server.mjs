import { version, unref, inject, defineComponent, ref, provide, createElementBlock, useSSRContext, mergeProps, withCtx, createVNode, toDisplayString, openBlock, createBlock, createCommentVNode, withModifiers, onUnmounted, watch, renderSlot, computed, reactive, isRef, createTextVNode, Fragment, renderList, createApp, effectScope, hasInjectionContext, getCurrentInstance, isReactive, toRaw, defineAsyncComponent, onErrorCaptured, onServerPrefetch, resolveDynamicComponent, toRef, h, isReadonly, getCurrentScope, onScopeDispose, nextTick, markRaw, toRefs, isShallow } from 'vue';
import { d as useRuntimeConfig$1, $ as $fetch, w as withQuery, l as hasProtocol, p as parseURL, m as isScriptProtocol, j as joinURL, h as createError$1, n as sanitizeStatusCode, o as createHooks, q as isEqual, r as stringifyParsedURL, t as stringifyQuery, v as parseQuery } from '../nitro/node-server.mjs';
import { getActiveHead } from 'unhead';
import { defineHeadPlugin } from '@unhead/shared';
import { ssrRenderComponent, ssrInterpolate, ssrRenderAttrs, ssrRenderSlot, ssrRenderClass, ssrRenderAttr, ssrIncludeBooleanAttr, ssrRenderDynamicModel, ssrLooseContain, ssrRenderStyle, ssrRenderList, ssrRenderSuspense, ssrRenderVNode } from 'vue/server-renderer';
import { Icon } from '@iconify/vue';
import draggable from 'vuedraggable';
import { computed as computed$1 } from '@vue/reactivity';
import 'node:http';
import 'node:https';
import 'fs';
import 'path';
import 'node:fs';
import 'node:url';

function createContext$1(opts = {}) {
  let currentInstance;
  let isSingleton = false;
  const checkConflict = (instance) => {
    if (currentInstance && currentInstance !== instance) {
      throw new Error("Context conflict");
    }
  };
  let als;
  if (opts.asyncContext) {
    const _AsyncLocalStorage = opts.AsyncLocalStorage || globalThis.AsyncLocalStorage;
    if (_AsyncLocalStorage) {
      als = new _AsyncLocalStorage();
    } else {
      console.warn("[unctx] `AsyncLocalStorage` is not provided.");
    }
  }
  const _getCurrentInstance = () => {
    if (als && currentInstance === void 0) {
      const instance = als.getStore();
      if (instance !== void 0) {
        return instance;
      }
    }
    return currentInstance;
  };
  return {
    use: () => {
      const _instance = _getCurrentInstance();
      if (_instance === void 0) {
        throw new Error("Context is not available");
      }
      return _instance;
    },
    tryUse: () => {
      return _getCurrentInstance();
    },
    set: (instance, replace) => {
      if (!replace) {
        checkConflict(instance);
      }
      currentInstance = instance;
      isSingleton = true;
    },
    unset: () => {
      currentInstance = void 0;
      isSingleton = false;
    },
    call: (instance, callback) => {
      checkConflict(instance);
      currentInstance = instance;
      try {
        return als ? als.run(instance, callback) : callback();
      } finally {
        if (!isSingleton) {
          currentInstance = void 0;
        }
      }
    },
    async callAsync(instance, callback) {
      currentInstance = instance;
      const onRestore = () => {
        currentInstance = instance;
      };
      const onLeave = () => currentInstance === instance ? onRestore : void 0;
      asyncHandlers$1.add(onLeave);
      try {
        const r = als ? als.run(instance, callback) : callback();
        if (!isSingleton) {
          currentInstance = void 0;
        }
        return await r;
      } finally {
        asyncHandlers$1.delete(onLeave);
      }
    }
  };
}
function createNamespace$1(defaultOpts = {}) {
  const contexts = {};
  return {
    get(key, opts = {}) {
      if (!contexts[key]) {
        contexts[key] = createContext$1({ ...defaultOpts, ...opts });
      }
      contexts[key];
      return contexts[key];
    }
  };
}
const _globalThis$1 = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : {};
const globalKey$2 = "__unctx__";
const defaultNamespace = _globalThis$1[globalKey$2] || (_globalThis$1[globalKey$2] = createNamespace$1());
const getContext = (key, opts = {}) => defaultNamespace.get(key, opts);
const asyncHandlersKey$1 = "__unctx_async_handlers__";
const asyncHandlers$1 = _globalThis$1[asyncHandlersKey$1] || (_globalThis$1[asyncHandlersKey$1] = /* @__PURE__ */ new Set());

const appConfig = useRuntimeConfig$1().app;
const baseURL = () => appConfig.baseURL;
if (!globalThis.$fetch) {
  globalThis.$fetch = $fetch.create({
    baseURL: baseURL()
  });
}
const nuxtAppCtx = /* @__PURE__ */ getContext("nuxt-app", {
  asyncContext: false
});
const NuxtPluginIndicator = "__nuxt_plugin";
function createNuxtApp(options) {
  let hydratingCount = 0;
  const nuxtApp = {
    _scope: effectScope(),
    provide: void 0,
    globalName: "nuxt",
    versions: {
      get nuxt() {
        return "3.10.3";
      },
      get vue() {
        return nuxtApp.vueApp.version;
      }
    },
    payload: reactive({
      data: {},
      state: {},
      once: /* @__PURE__ */ new Set(),
      _errors: {},
      ...{ serverRendered: true }
    }),
    static: {
      data: {}
    },
    runWithContext: (fn) => nuxtApp._scope.run(() => callWithNuxt(nuxtApp, fn)),
    isHydrating: false,
    deferHydration() {
      if (!nuxtApp.isHydrating) {
        return () => {
        };
      }
      hydratingCount++;
      let called = false;
      return () => {
        if (called) {
          return;
        }
        called = true;
        hydratingCount--;
        if (hydratingCount === 0) {
          nuxtApp.isHydrating = false;
          return nuxtApp.callHook("app:suspense:resolve");
        }
      };
    },
    _asyncDataPromises: {},
    _asyncData: {},
    _payloadRevivers: {},
    ...options
  };
  nuxtApp.hooks = createHooks();
  nuxtApp.hook = nuxtApp.hooks.hook;
  {
    const contextCaller = async function(hooks, args) {
      for (const hook of hooks) {
        await nuxtApp.runWithContext(() => hook(...args));
      }
    };
    nuxtApp.hooks.callHook = (name, ...args) => nuxtApp.hooks.callHookWith(contextCaller, name, ...args);
  }
  nuxtApp.callHook = nuxtApp.hooks.callHook;
  nuxtApp.provide = (name, value) => {
    const $name = "$" + name;
    defineGetter(nuxtApp, $name, value);
    defineGetter(nuxtApp.vueApp.config.globalProperties, $name, value);
  };
  defineGetter(nuxtApp.vueApp, "$nuxt", nuxtApp);
  defineGetter(nuxtApp.vueApp.config.globalProperties, "$nuxt", nuxtApp);
  {
    if (nuxtApp.ssrContext) {
      nuxtApp.ssrContext.nuxt = nuxtApp;
      nuxtApp.ssrContext._payloadReducers = {};
      nuxtApp.payload.path = nuxtApp.ssrContext.url;
    }
    nuxtApp.ssrContext = nuxtApp.ssrContext || {};
    if (nuxtApp.ssrContext.payload) {
      Object.assign(nuxtApp.payload, nuxtApp.ssrContext.payload);
    }
    nuxtApp.ssrContext.payload = nuxtApp.payload;
    nuxtApp.ssrContext.config = {
      public: options.ssrContext.runtimeConfig.public,
      app: options.ssrContext.runtimeConfig.app
    };
  }
  const runtimeConfig = options.ssrContext.runtimeConfig;
  nuxtApp.provide("config", runtimeConfig);
  return nuxtApp;
}
async function applyPlugin(nuxtApp, plugin2) {
  if (plugin2.hooks) {
    nuxtApp.hooks.addHooks(plugin2.hooks);
  }
  if (typeof plugin2 === "function") {
    const { provide: provide2 } = await nuxtApp.runWithContext(() => plugin2(nuxtApp)) || {};
    if (provide2 && typeof provide2 === "object") {
      for (const key in provide2) {
        nuxtApp.provide(key, provide2[key]);
      }
    }
  }
}
async function applyPlugins(nuxtApp, plugins2) {
  var _a, _b;
  const resolvedPlugins = [];
  const unresolvedPlugins = [];
  const parallels = [];
  const errors = [];
  let promiseDepth = 0;
  async function executePlugin(plugin2) {
    var _a2;
    const unresolvedPluginsForThisPlugin = ((_a2 = plugin2.dependsOn) == null ? void 0 : _a2.filter((name) => plugins2.some((p) => p._name === name) && !resolvedPlugins.includes(name))) ?? [];
    if (unresolvedPluginsForThisPlugin.length > 0) {
      unresolvedPlugins.push([new Set(unresolvedPluginsForThisPlugin), plugin2]);
    } else {
      const promise = applyPlugin(nuxtApp, plugin2).then(async () => {
        if (plugin2._name) {
          resolvedPlugins.push(plugin2._name);
          await Promise.all(unresolvedPlugins.map(async ([dependsOn, unexecutedPlugin]) => {
            if (dependsOn.has(plugin2._name)) {
              dependsOn.delete(plugin2._name);
              if (dependsOn.size === 0) {
                promiseDepth++;
                await executePlugin(unexecutedPlugin);
              }
            }
          }));
        }
      });
      if (plugin2.parallel) {
        parallels.push(promise.catch((e) => errors.push(e)));
      } else {
        await promise;
      }
    }
  }
  for (const plugin2 of plugins2) {
    if (((_a = nuxtApp.ssrContext) == null ? void 0 : _a.islandContext) && ((_b = plugin2.env) == null ? void 0 : _b.islands) === false) {
      continue;
    }
    await executePlugin(plugin2);
  }
  await Promise.all(parallels);
  if (promiseDepth) {
    for (let i = 0; i < promiseDepth; i++) {
      await Promise.all(parallels);
    }
  }
  if (errors.length) {
    throw errors[0];
  }
}
// @__NO_SIDE_EFFECTS__
function defineNuxtPlugin(plugin2) {
  if (typeof plugin2 === "function") {
    return plugin2;
  }
  const _name = plugin2._name || plugin2.name;
  delete plugin2.name;
  return Object.assign(plugin2.setup || (() => {
  }), plugin2, { [NuxtPluginIndicator]: true, _name });
}
function callWithNuxt(nuxt, setup, args) {
  const fn = () => args ? setup(...args) : setup();
  {
    return nuxt.vueApp.runWithContext(() => nuxtAppCtx.callAsync(nuxt, fn));
  }
}
// @__NO_SIDE_EFFECTS__
function tryUseNuxtApp() {
  var _a;
  let nuxtAppInstance;
  if (hasInjectionContext()) {
    nuxtAppInstance = (_a = getCurrentInstance()) == null ? void 0 : _a.appContext.app.$nuxt;
  }
  nuxtAppInstance = nuxtAppInstance || nuxtAppCtx.tryUse();
  return nuxtAppInstance || null;
}
// @__NO_SIDE_EFFECTS__
function useNuxtApp() {
  const nuxtAppInstance = /* @__PURE__ */ tryUseNuxtApp();
  if (!nuxtAppInstance) {
    {
      throw new Error("[nuxt] instance unavailable");
    }
  }
  return nuxtAppInstance;
}
// @__NO_SIDE_EFFECTS__
function useRuntimeConfig(_event) {
  return (/* @__PURE__ */ useNuxtApp()).$config;
}
function defineGetter(obj, key, val) {
  Object.defineProperty(obj, key, { get: () => val });
}
const PageRouteSymbol = Symbol("route");
const useRouter = () => {
  var _a;
  return (_a = /* @__PURE__ */ useNuxtApp()) == null ? void 0 : _a.$router;
};
const useRoute = () => {
  if (hasInjectionContext()) {
    return inject(PageRouteSymbol, (/* @__PURE__ */ useNuxtApp())._route);
  }
  return (/* @__PURE__ */ useNuxtApp())._route;
};
// @__NO_SIDE_EFFECTS__
function defineNuxtRouteMiddleware(middleware) {
  return middleware;
}
const isProcessingMiddleware = () => {
  try {
    if ((/* @__PURE__ */ useNuxtApp())._processingMiddleware) {
      return true;
    }
  } catch {
    return true;
  }
  return false;
};
const navigateTo = (to, options) => {
  if (!to) {
    to = "/";
  }
  const toPath = typeof to === "string" ? to : withQuery(to.path || "/", to.query || {}) + (to.hash || "");
  if (options == null ? void 0 : options.open) {
    return Promise.resolve();
  }
  const isExternal = (options == null ? void 0 : options.external) || hasProtocol(toPath, { acceptRelative: true });
  if (isExternal) {
    if (!(options == null ? void 0 : options.external)) {
      throw new Error("Navigating to an external URL is not allowed by default. Use `navigateTo(url, { external: true })`.");
    }
    const protocol = parseURL(toPath).protocol;
    if (protocol && isScriptProtocol(protocol)) {
      throw new Error(`Cannot navigate to a URL with '${protocol}' protocol.`);
    }
  }
  const inMiddleware = isProcessingMiddleware();
  const router = useRouter();
  const nuxtApp = /* @__PURE__ */ useNuxtApp();
  {
    if (nuxtApp.ssrContext) {
      const fullPath = typeof to === "string" || isExternal ? toPath : router.resolve(to).fullPath || "/";
      const location2 = isExternal ? toPath : joinURL((/* @__PURE__ */ useRuntimeConfig()).app.baseURL, fullPath);
      const redirect = async function(response) {
        await nuxtApp.callHook("app:redirected");
        const encodedLoc = location2.replace(/"/g, "%22");
        nuxtApp.ssrContext._renderResponse = {
          statusCode: sanitizeStatusCode((options == null ? void 0 : options.redirectCode) || 302, 302),
          body: `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`,
          headers: { location: location2 }
        };
        return response;
      };
      if (!isExternal && inMiddleware) {
        router.afterEach((final) => final.fullPath === fullPath ? redirect(false) : void 0);
        return to;
      }
      return redirect(!inMiddleware ? void 0 : (
        /* abort route navigation */
        false
      ));
    }
  }
  if (isExternal) {
    nuxtApp._scope.stop();
    if (options == null ? void 0 : options.replace) {
      (void 0).replace(toPath);
    } else {
      (void 0).href = toPath;
    }
    if (inMiddleware) {
      if (!nuxtApp.isHydrating) {
        return false;
      }
      return new Promise(() => {
      });
    }
    return Promise.resolve();
  }
  return (options == null ? void 0 : options.replace) ? router.replace(to) : router.push(to);
};
const NUXT_ERROR_SIGNATURE = "__nuxt_error";
const useError = () => toRef((/* @__PURE__ */ useNuxtApp()).payload, "error");
const showError = (error) => {
  const nuxtError = createError(error);
  try {
    const nuxtApp = /* @__PURE__ */ useNuxtApp();
    const error2 = useError();
    if (false)
      ;
    error2.value = error2.value || nuxtError;
  } catch {
    throw nuxtError;
  }
  return nuxtError;
};
const isNuxtError = (error) => !!error && typeof error === "object" && NUXT_ERROR_SIGNATURE in error;
const createError = (error) => {
  const nuxtError = createError$1(error);
  Object.defineProperty(nuxtError, NUXT_ERROR_SIGNATURE, {
    value: true,
    configurable: false,
    writable: false
  });
  return nuxtError;
};
version.startsWith("3");
function resolveUnref(r) {
  return typeof r === "function" ? r() : unref(r);
}
function resolveUnrefHeadInput(ref2, lastKey = "") {
  if (ref2 instanceof Promise)
    return ref2;
  const root = resolveUnref(ref2);
  if (!ref2 || !root)
    return root;
  if (Array.isArray(root))
    return root.map((r) => resolveUnrefHeadInput(r, lastKey));
  if (typeof root === "object") {
    return Object.fromEntries(
      Object.entries(root).map(([k, v]) => {
        if (k === "titleTemplate" || k.startsWith("on"))
          return [k, unref(v)];
        return [k, resolveUnrefHeadInput(v, k)];
      })
    );
  }
  return root;
}
defineHeadPlugin({
  hooks: {
    "entries:resolve": function(ctx) {
      for (const entry2 of ctx.entries)
        entry2.resolvedInput = resolveUnrefHeadInput(entry2.input);
    }
  }
});
const headSymbol = "usehead";
const _global = typeof globalThis !== "undefined" ? globalThis : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
const globalKey$1 = "__unhead_injection_handler__";
function setHeadInjectionHandler(handler) {
  _global[globalKey$1] = handler;
}
function injectHead() {
  if (globalKey$1 in _global) {
    return _global[globalKey$1]();
  }
  const head = inject(headSymbol);
  if (!head && "production" !== "production")
    console.warn("Unhead is missing Vue context, falling back to shared context. This may have unexpected results.");
  return head || getActiveHead();
}
const unhead_KgADcZ0jPj = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:head",
  enforce: "pre",
  setup(nuxtApp) {
    const head = nuxtApp.ssrContext.head;
    setHeadInjectionHandler(
      // need a fresh instance of the nuxt app to avoid parallel requests interfering with each other
      () => (/* @__PURE__ */ useNuxtApp()).vueApp._context.provides.usehead
    );
    nuxtApp.vueApp.use(head);
  }
});
function createContext(opts = {}) {
  let currentInstance;
  let isSingleton = false;
  const checkConflict = (instance) => {
    if (currentInstance && currentInstance !== instance) {
      throw new Error("Context conflict");
    }
  };
  let als;
  if (opts.asyncContext) {
    const _AsyncLocalStorage = opts.AsyncLocalStorage || globalThis.AsyncLocalStorage;
    if (_AsyncLocalStorage) {
      als = new _AsyncLocalStorage();
    } else {
      console.warn("[unctx] `AsyncLocalStorage` is not provided.");
    }
  }
  const _getCurrentInstance = () => {
    if (als && currentInstance === void 0) {
      const instance = als.getStore();
      if (instance !== void 0) {
        return instance;
      }
    }
    return currentInstance;
  };
  return {
    use: () => {
      const _instance = _getCurrentInstance();
      if (_instance === void 0) {
        throw new Error("Context is not available");
      }
      return _instance;
    },
    tryUse: () => {
      return _getCurrentInstance();
    },
    set: (instance, replace) => {
      if (!replace) {
        checkConflict(instance);
      }
      currentInstance = instance;
      isSingleton = true;
    },
    unset: () => {
      currentInstance = void 0;
      isSingleton = false;
    },
    call: (instance, callback) => {
      checkConflict(instance);
      currentInstance = instance;
      try {
        return als ? als.run(instance, callback) : callback();
      } finally {
        if (!isSingleton) {
          currentInstance = void 0;
        }
      }
    },
    async callAsync(instance, callback) {
      currentInstance = instance;
      const onRestore = () => {
        currentInstance = instance;
      };
      const onLeave = () => currentInstance === instance ? onRestore : void 0;
      asyncHandlers.add(onLeave);
      try {
        const r = als ? als.run(instance, callback) : callback();
        if (!isSingleton) {
          currentInstance = void 0;
        }
        return await r;
      } finally {
        asyncHandlers.delete(onLeave);
      }
    }
  };
}
function createNamespace(defaultOpts = {}) {
  const contexts = {};
  return {
    get(key, opts = {}) {
      if (!contexts[key]) {
        contexts[key] = createContext({ ...defaultOpts, ...opts });
      }
      contexts[key];
      return contexts[key];
    }
  };
}
const _globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : {};
const globalKey = "__unctx__";
_globalThis[globalKey] || (_globalThis[globalKey] = createNamespace());
const asyncHandlersKey = "__unctx_async_handlers__";
const asyncHandlers = _globalThis[asyncHandlersKey] || (_globalThis[asyncHandlersKey] = /* @__PURE__ */ new Set());
const manifest_45route_45rule = /* @__PURE__ */ defineNuxtRouteMiddleware(async (to) => {
  {
    return;
  }
});
const globalMiddleware = [
  manifest_45route_45rule
];
function getRouteFromPath(fullPath) {
  if (typeof fullPath === "object") {
    fullPath = stringifyParsedURL({
      pathname: fullPath.path || "",
      search: stringifyQuery(fullPath.query || {}),
      hash: fullPath.hash || ""
    });
  }
  const url = parseURL(fullPath.toString());
  return {
    path: url.pathname,
    fullPath,
    query: parseQuery(url.search),
    hash: url.hash,
    // stub properties for compat with vue-router
    params: {},
    name: void 0,
    matched: [],
    redirectedFrom: void 0,
    meta: {},
    href: fullPath
  };
}
const router_CaKIoANnI2 = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:router",
  enforce: "pre",
  setup(nuxtApp) {
    const initialURL = nuxtApp.ssrContext.url;
    const routes = [];
    const hooks = {
      "navigate:before": [],
      "resolve:before": [],
      "navigate:after": [],
      error: []
    };
    const registerHook = (hook, guard) => {
      hooks[hook].push(guard);
      return () => hooks[hook].splice(hooks[hook].indexOf(guard), 1);
    };
    (/* @__PURE__ */ useRuntimeConfig()).app.baseURL;
    const route = reactive(getRouteFromPath(initialURL));
    async function handleNavigation(url, replace) {
      try {
        const to = getRouteFromPath(url);
        for (const middleware of hooks["navigate:before"]) {
          const result = await middleware(to, route);
          if (result === false || result instanceof Error) {
            return;
          }
          if (typeof result === "string" && result.length) {
            return handleNavigation(result, true);
          }
        }
        for (const handler of hooks["resolve:before"]) {
          await handler(to, route);
        }
        Object.assign(route, to);
        if (false)
          ;
        for (const middleware of hooks["navigate:after"]) {
          await middleware(to, route);
        }
      } catch (err) {
        for (const handler of hooks.error) {
          await handler(err);
        }
      }
    }
    const currentRoute = computed(() => route);
    const router = {
      currentRoute,
      isReady: () => Promise.resolve(),
      // These options provide a similar API to vue-router but have no effect
      options: {},
      install: () => Promise.resolve(),
      // Navigation
      push: (url) => handleNavigation(url),
      replace: (url) => handleNavigation(url),
      back: () => (void 0).history.go(-1),
      go: (delta) => (void 0).history.go(delta),
      forward: () => (void 0).history.go(1),
      // Guards
      beforeResolve: (guard) => registerHook("resolve:before", guard),
      beforeEach: (guard) => registerHook("navigate:before", guard),
      afterEach: (guard) => registerHook("navigate:after", guard),
      onError: (handler) => registerHook("error", handler),
      // Routes
      resolve: getRouteFromPath,
      addRoute: (parentName, route2) => {
        routes.push(route2);
      },
      getRoutes: () => routes,
      hasRoute: (name) => routes.some((route2) => route2.name === name),
      removeRoute: (name) => {
        const index = routes.findIndex((route2) => route2.name === name);
        if (index !== -1) {
          routes.splice(index, 1);
        }
      }
    };
    nuxtApp.vueApp.component("RouterLink", defineComponent({
      functional: true,
      props: {
        to: {
          type: String,
          required: true
        },
        custom: Boolean,
        replace: Boolean,
        // Not implemented
        activeClass: String,
        exactActiveClass: String,
        ariaCurrentValue: String
      },
      setup: (props, { slots }) => {
        const navigate = () => handleNavigation(props.to, props.replace);
        return () => {
          var _a;
          const route2 = router.resolve(props.to);
          return props.custom ? (_a = slots.default) == null ? void 0 : _a.call(slots, { href: props.to, navigate, route: route2 }) : h("a", { href: props.to, onClick: (e) => {
            e.preventDefault();
            return navigate();
          } }, slots);
        };
      }
    }));
    nuxtApp._route = route;
    nuxtApp._middleware = nuxtApp._middleware || {
      global: [],
      named: {}
    };
    const initialLayout = nuxtApp.payload.state._layout;
    nuxtApp.hooks.hookOnce("app:created", async () => {
      router.beforeEach(async (to, from) => {
        var _a;
        to.meta = reactive(to.meta || {});
        if (nuxtApp.isHydrating && initialLayout && !isReadonly(to.meta.layout)) {
          to.meta.layout = initialLayout;
        }
        nuxtApp._processingMiddleware = true;
        if (!((_a = nuxtApp.ssrContext) == null ? void 0 : _a.islandContext)) {
          const middlewareEntries = /* @__PURE__ */ new Set([...globalMiddleware, ...nuxtApp._middleware.global]);
          for (const middleware of middlewareEntries) {
            const result = await nuxtApp.runWithContext(() => middleware(to, from));
            {
              if (result === false || result instanceof Error) {
                const error = result || createError$1({
                  statusCode: 404,
                  statusMessage: `Page Not Found: ${initialURL}`,
                  data: {
                    path: initialURL
                  }
                });
                delete nuxtApp._processingMiddleware;
                return nuxtApp.runWithContext(() => showError(error));
              }
            }
            if (result === true) {
              continue;
            }
            if (result || result === false) {
              return result;
            }
          }
        }
      });
      router.afterEach(() => {
        delete nuxtApp._processingMiddleware;
      });
      await router.replace(initialURL);
      if (!isEqual(route.fullPath, initialURL)) {
        await nuxtApp.runWithContext(() => navigateTo(route.fullPath));
      }
    });
    return {
      provide: {
        route,
        router
      }
    };
  }
});
const isVue2 = false;
/*!
 * pinia v2.1.7
 * (c) 2023 Eduardo San Martin Morote
 * @license MIT
 */
let activePinia;
const setActivePinia = (pinia) => activePinia = pinia;
const piniaSymbol = (
  /* istanbul ignore next */
  Symbol()
);
function isPlainObject(o) {
  return o && typeof o === "object" && Object.prototype.toString.call(o) === "[object Object]" && typeof o.toJSON !== "function";
}
var MutationType;
(function(MutationType2) {
  MutationType2["direct"] = "direct";
  MutationType2["patchObject"] = "patch object";
  MutationType2["patchFunction"] = "patch function";
})(MutationType || (MutationType = {}));
function createPinia() {
  const scope = effectScope(true);
  const state = scope.run(() => ref({}));
  let _p = [];
  let toBeInstalled = [];
  const pinia = markRaw({
    install(app) {
      setActivePinia(pinia);
      {
        pinia._a = app;
        app.provide(piniaSymbol, pinia);
        app.config.globalProperties.$pinia = pinia;
        toBeInstalled.forEach((plugin2) => _p.push(plugin2));
        toBeInstalled = [];
      }
    },
    use(plugin2) {
      if (!this._a && !isVue2) {
        toBeInstalled.push(plugin2);
      } else {
        _p.push(plugin2);
      }
      return this;
    },
    _p,
    // it's actually undefined here
    // @ts-expect-error
    _a: null,
    _e: scope,
    _s: /* @__PURE__ */ new Map(),
    state
  });
  return pinia;
}
const noop = () => {
};
function addSubscription(subscriptions, callback, detached, onCleanup = noop) {
  subscriptions.push(callback);
  const removeSubscription = () => {
    const idx = subscriptions.indexOf(callback);
    if (idx > -1) {
      subscriptions.splice(idx, 1);
      onCleanup();
    }
  };
  if (!detached && getCurrentScope()) {
    onScopeDispose(removeSubscription);
  }
  return removeSubscription;
}
function triggerSubscriptions(subscriptions, ...args) {
  subscriptions.slice().forEach((callback) => {
    callback(...args);
  });
}
const fallbackRunWithContext = (fn) => fn();
function mergeReactiveObjects(target, patchToApply) {
  if (target instanceof Map && patchToApply instanceof Map) {
    patchToApply.forEach((value, key) => target.set(key, value));
  }
  if (target instanceof Set && patchToApply instanceof Set) {
    patchToApply.forEach(target.add, target);
  }
  for (const key in patchToApply) {
    if (!patchToApply.hasOwnProperty(key))
      continue;
    const subPatch = patchToApply[key];
    const targetValue = target[key];
    if (isPlainObject(targetValue) && isPlainObject(subPatch) && target.hasOwnProperty(key) && !isRef(subPatch) && !isReactive(subPatch)) {
      target[key] = mergeReactiveObjects(targetValue, subPatch);
    } else {
      target[key] = subPatch;
    }
  }
  return target;
}
const skipHydrateSymbol = (
  /* istanbul ignore next */
  Symbol()
);
function shouldHydrate(obj) {
  return !isPlainObject(obj) || !obj.hasOwnProperty(skipHydrateSymbol);
}
const { assign } = Object;
function isComputed(o) {
  return !!(isRef(o) && o.effect);
}
function createOptionsStore(id, options, pinia, hot) {
  const { state, actions, getters } = options;
  const initialState = pinia.state.value[id];
  let store;
  function setup() {
    if (!initialState && (!("production" !== "production") )) {
      {
        pinia.state.value[id] = state ? state() : {};
      }
    }
    const localState = toRefs(pinia.state.value[id]);
    return assign(localState, actions, Object.keys(getters || {}).reduce((computedGetters, name) => {
      computedGetters[name] = markRaw(computed(() => {
        setActivePinia(pinia);
        const store2 = pinia._s.get(id);
        return getters[name].call(store2, store2);
      }));
      return computedGetters;
    }, {}));
  }
  store = createSetupStore(id, setup, options, pinia, hot, true);
  return store;
}
function createSetupStore($id, setup, options = {}, pinia, hot, isOptionsStore) {
  let scope;
  const optionsForPlugin = assign({ actions: {} }, options);
  const $subscribeOptions = {
    deep: true
    // flush: 'post',
  };
  let isListening;
  let isSyncListening;
  let subscriptions = [];
  let actionSubscriptions = [];
  let debuggerEvents;
  const initialState = pinia.state.value[$id];
  if (!isOptionsStore && !initialState && (!("production" !== "production") )) {
    {
      pinia.state.value[$id] = {};
    }
  }
  ref({});
  let activeListener;
  function $patch(partialStateOrMutator) {
    let subscriptionMutation;
    isListening = isSyncListening = false;
    if (typeof partialStateOrMutator === "function") {
      partialStateOrMutator(pinia.state.value[$id]);
      subscriptionMutation = {
        type: MutationType.patchFunction,
        storeId: $id,
        events: debuggerEvents
      };
    } else {
      mergeReactiveObjects(pinia.state.value[$id], partialStateOrMutator);
      subscriptionMutation = {
        type: MutationType.patchObject,
        payload: partialStateOrMutator,
        storeId: $id,
        events: debuggerEvents
      };
    }
    const myListenerId = activeListener = Symbol();
    nextTick().then(() => {
      if (activeListener === myListenerId) {
        isListening = true;
      }
    });
    isSyncListening = true;
    triggerSubscriptions(subscriptions, subscriptionMutation, pinia.state.value[$id]);
  }
  const $reset = isOptionsStore ? function $reset2() {
    const { state } = options;
    const newState = state ? state() : {};
    this.$patch(($state) => {
      assign($state, newState);
    });
  } : (
    /* istanbul ignore next */
    noop
  );
  function $dispose() {
    scope.stop();
    subscriptions = [];
    actionSubscriptions = [];
    pinia._s.delete($id);
  }
  function wrapAction(name, action) {
    return function() {
      setActivePinia(pinia);
      const args = Array.from(arguments);
      const afterCallbackList = [];
      const onErrorCallbackList = [];
      function after(callback) {
        afterCallbackList.push(callback);
      }
      function onError(callback) {
        onErrorCallbackList.push(callback);
      }
      triggerSubscriptions(actionSubscriptions, {
        args,
        name,
        store,
        after,
        onError
      });
      let ret;
      try {
        ret = action.apply(this && this.$id === $id ? this : store, args);
      } catch (error) {
        triggerSubscriptions(onErrorCallbackList, error);
        throw error;
      }
      if (ret instanceof Promise) {
        return ret.then((value) => {
          triggerSubscriptions(afterCallbackList, value);
          return value;
        }).catch((error) => {
          triggerSubscriptions(onErrorCallbackList, error);
          return Promise.reject(error);
        });
      }
      triggerSubscriptions(afterCallbackList, ret);
      return ret;
    };
  }
  const partialStore = {
    _p: pinia,
    // _s: scope,
    $id,
    $onAction: addSubscription.bind(null, actionSubscriptions),
    $patch,
    $reset,
    $subscribe(callback, options2 = {}) {
      const removeSubscription = addSubscription(subscriptions, callback, options2.detached, () => stopWatcher());
      const stopWatcher = scope.run(() => watch(() => pinia.state.value[$id], (state) => {
        if (options2.flush === "sync" ? isSyncListening : isListening) {
          callback({
            storeId: $id,
            type: MutationType.direct,
            events: debuggerEvents
          }, state);
        }
      }, assign({}, $subscribeOptions, options2)));
      return removeSubscription;
    },
    $dispose
  };
  const store = reactive(partialStore);
  pinia._s.set($id, store);
  const runWithContext = pinia._a && pinia._a.runWithContext || fallbackRunWithContext;
  const setupStore = runWithContext(() => pinia._e.run(() => (scope = effectScope()).run(setup)));
  for (const key in setupStore) {
    const prop = setupStore[key];
    if (isRef(prop) && !isComputed(prop) || isReactive(prop)) {
      if (!isOptionsStore) {
        if (initialState && shouldHydrate(prop)) {
          if (isRef(prop)) {
            prop.value = initialState[key];
          } else {
            mergeReactiveObjects(prop, initialState[key]);
          }
        }
        {
          pinia.state.value[$id][key] = prop;
        }
      }
    } else if (typeof prop === "function") {
      const actionValue = wrapAction(key, prop);
      {
        setupStore[key] = actionValue;
      }
      optionsForPlugin.actions[key] = prop;
    } else ;
  }
  {
    assign(store, setupStore);
    assign(toRaw(store), setupStore);
  }
  Object.defineProperty(store, "$state", {
    get: () => pinia.state.value[$id],
    set: (state) => {
      $patch(($state) => {
        assign($state, state);
      });
    }
  });
  pinia._p.forEach((extender) => {
    {
      assign(store, scope.run(() => extender({
        store,
        app: pinia._a,
        pinia,
        options: optionsForPlugin
      })));
    }
  });
  if (initialState && isOptionsStore && options.hydrate) {
    options.hydrate(store.$state, initialState);
  }
  isListening = true;
  isSyncListening = true;
  return store;
}
function defineStore(idOrOptions, setup, setupOptions) {
  let id;
  let options;
  const isSetupStore = typeof setup === "function";
  if (typeof idOrOptions === "string") {
    id = idOrOptions;
    options = isSetupStore ? setupOptions : setup;
  } else {
    options = idOrOptions;
    id = idOrOptions.id;
  }
  function useStore(pinia, hot) {
    const hasContext = hasInjectionContext();
    pinia = // in test mode, ignore the argument provided as we can always retrieve a
    // pinia instance with getActivePinia()
    (pinia) || (hasContext ? inject(piniaSymbol, null) : null);
    if (pinia)
      setActivePinia(pinia);
    pinia = activePinia;
    if (!pinia._s.has(id)) {
      if (isSetupStore) {
        createSetupStore(id, setup, options, pinia);
      } else {
        createOptionsStore(id, options, pinia);
      }
    }
    const store = pinia._s.get(id);
    return store;
  }
  useStore.$id = id;
  return useStore;
}
function definePayloadReducer(name, reduce) {
  {
    (/* @__PURE__ */ useNuxtApp()).ssrContext._payloadReducers[name] = reduce;
  }
}
const clientOnlySymbol = Symbol.for("nuxt:client-only");
defineComponent({
  name: "ClientOnly",
  inheritAttrs: false,
  // eslint-disable-next-line vue/require-prop-types
  props: ["fallback", "placeholder", "placeholderTag", "fallbackTag"],
  setup(_, { slots, attrs }) {
    const mounted = ref(false);
    provide(clientOnlySymbol, true);
    return (props) => {
      var _a;
      if (mounted.value) {
        return (_a = slots.default) == null ? void 0 : _a.call(slots);
      }
      const slot = slots.fallback || slots.placeholder;
      if (slot) {
        return slot();
      }
      const fallbackStr = props.fallback || props.placeholder || "";
      const fallbackTag = props.fallbackTag || props.placeholderTag || "span";
      return createElementBlock(fallbackTag, attrs, fallbackStr);
    };
  }
});
const plugin = /* @__PURE__ */ defineNuxtPlugin((nuxtApp) => {
  const pinia = createPinia();
  nuxtApp.vueApp.use(pinia);
  setActivePinia(pinia);
  {
    nuxtApp.payload.pinia = pinia.state.value;
  }
  return {
    provide: {
      pinia
    }
  };
});
const reducers = {
  NuxtError: (data) => isNuxtError(data) && data.toJSON(),
  EmptyShallowRef: (data) => isRef(data) && isShallow(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_"),
  EmptyRef: (data) => isRef(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_"),
  ShallowRef: (data) => isRef(data) && isShallow(data) && data.value,
  ShallowReactive: (data) => isReactive(data) && isShallow(data) && toRaw(data),
  Ref: (data) => isRef(data) && data.value,
  Reactive: (data) => isReactive(data) && toRaw(data)
};
const revive_payload_server_eJ33V7gbc6 = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:revive-payload:server",
  setup() {
    for (const reducer in reducers) {
      definePayloadReducer(reducer, reducers[reducer]);
    }
  }
});
const components_plugin_KR1HBZs4kY = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:global-components"
});
const plugins = [
  unhead_KgADcZ0jPj,
  router_CaKIoANnI2,
  plugin,
  revive_payload_server_eJ33V7gbc6,
  components_plugin_KR1HBZs4kY
];
const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const _sfc_main$g = {};
function _sfc_ssrRender$1(_ctx, _push, _parent, _attrs) {
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "box-frame" }, _attrs))} data-v-d112d77d>`);
  ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
  _push(`</div>`);
}
const _sfc_setup$g = _sfc_main$g.setup;
_sfc_main$g.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/block/boxFrame/index.vue");
  return _sfc_setup$g ? _sfc_setup$g(props, ctx) : void 0;
};
const __nuxt_component_0$3 = /* @__PURE__ */ _export_sfc(_sfc_main$g, [["ssrRender", _sfc_ssrRender$1], ["__scopeId", "data-v-d112d77d"]]);
const prepareIconsType = (config) => config;
const icons = prepareIconsType({
  Plus: "ic:round-plus",
  Bin: "mingcute:delete-fill",
  Handle: "gg:menu-grid-o",
  Box: "system-uicons:box",
  BoxOpen: "system-uicons:box-open",
  Pen: "solar:pen-bold",
  Info: "akar-icons:info",
  BoxesDelete: "fluent:box-dismiss-20-regular",
  Restart: "solar:restart-outline",
  Times: "uil:times"
});
const icons$1 = icons;
const _sfc_main$f = /* @__PURE__ */ defineComponent({
  __name: "icon",
  __ssrInlineRender: true,
  props: {
    icon: {},
    size: {}
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(unref(Icon), mergeProps({
        width: _ctx.size ?? null,
        height: _ctx.size ?? null,
        icon: unref(icons$1)[_ctx.icon] ?? _ctx.icon
      }, _attrs), null, _parent));
    };
  }
});
const _sfc_setup$f = _sfc_main$f.setup;
_sfc_main$f.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ui/icon.vue");
  return _sfc_setup$f ? _sfc_setup$f(props, ctx) : void 0;
};
const _sfc_main$e = /* @__PURE__ */ defineComponent({
  __name: "box",
  __ssrInlineRender: true,
  props: {
    isEdit: { type: Boolean },
    isContentNull: { type: Boolean },
    modelValue: {}
  },
  emits: ["drop", "delete", "edit", "editExtended", "info"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    function drop() {
      !props.isEdit && emit("drop", props.modelValue.id);
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_block_box_frame = __nuxt_component_0$3;
      const _component_ui_icon = _sfc_main$f;
      _push(ssrRenderComponent(_component_block_box_frame, mergeProps({
        class: ["black-box", {
          "black-box--edited": _ctx.isEdit,
          "black-box--null": _ctx.isContentNull
        }],
        onClick: drop
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="black-box__box" data-v-d0641039${_scopeId}>`);
            _push2(ssrRenderComponent(_component_ui_icon, {
              icon: _ctx.isContentNull ? "BoxOpen" : "Box",
              size: "100px"
            }, null, _parent2, _scopeId));
            _push2(`</div><div class="black-box__title" data-v-d0641039${_scopeId}>${ssrInterpolate(_ctx.modelValue.title)}</div>`);
            if (_ctx.isContentNull && !_ctx.isEdit) {
              _push2(`<div class="black-box__null" data-v-d0641039${_scopeId}> (Пусто) </div>`);
            } else {
              _push2(`<!---->`);
            }
            if (!_ctx.isEdit) {
              _push2(`<div class="black-box__info" data-v-d0641039${_scopeId}>`);
              _push2(ssrRenderComponent(_component_ui_icon, { icon: "Info" }, null, _parent2, _scopeId));
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            if (_ctx.isEdit) {
              _push2(`<div class="black-box__actions" data-v-d0641039${_scopeId}><div class="black-box__actions__button" data-v-d0641039${_scopeId}>`);
              _push2(ssrRenderComponent(_component_ui_icon, {
                icon: "Pen",
                size: "20px"
              }, null, _parent2, _scopeId));
              _push2(`</div><div class="black-box__actions__button" data-v-d0641039${_scopeId}>`);
              _push2(ssrRenderComponent(_component_ui_icon, {
                icon: "Bin",
                size: "20px"
              }, null, _parent2, _scopeId));
              _push2(`</div></div>`);
            } else {
              _push2(`<!---->`);
            }
          } else {
            return [
              createVNode("div", { class: "black-box__box" }, [
                createVNode(_component_ui_icon, {
                  icon: _ctx.isContentNull ? "BoxOpen" : "Box",
                  size: "100px"
                }, null, 8, ["icon"])
              ]),
              createVNode("div", { class: "black-box__title" }, toDisplayString(_ctx.modelValue.title), 1),
              _ctx.isContentNull && !_ctx.isEdit ? (openBlock(), createBlock("div", {
                key: 0,
                class: "black-box__null"
              }, " (Пусто) ")) : createCommentVNode("", true),
              !_ctx.isEdit ? (openBlock(), createBlock("div", {
                key: 1,
                class: "black-box__info",
                onClick: withModifiers(($event) => emit("info", _ctx.modelValue.id), ["stop"])
              }, [
                createVNode(_component_ui_icon, { icon: "Info" })
              ], 8, ["onClick"])) : createCommentVNode("", true),
              _ctx.isEdit ? (openBlock(), createBlock("div", {
                key: 2,
                class: "black-box__actions"
              }, [
                createVNode("div", {
                  class: "black-box__actions__button",
                  onClick: [
                    ($event) => emit("edit", _ctx.modelValue.id),
                    withModifiers(($event) => emit("editExtended", _ctx.modelValue.id), ["ctrl"])
                  ]
                }, [
                  createVNode(_component_ui_icon, {
                    icon: "Pen",
                    size: "20px"
                  })
                ], 8, ["onClick"]),
                createVNode("div", {
                  class: "black-box__actions__button",
                  onClick: ($event) => emit("delete", _ctx.modelValue.id)
                }, [
                  createVNode(_component_ui_icon, {
                    icon: "Bin",
                    size: "20px"
                  })
                ], 8, ["onClick"])
              ])) : createCommentVNode("", true)
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$e = _sfc_main$e.setup;
_sfc_main$e.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/block/boxFrame/box.vue");
  return _sfc_setup$e ? _sfc_setup$e(props, ctx) : void 0;
};
const __nuxt_component_0$2 = /* @__PURE__ */ _export_sfc(_sfc_main$e, [["__scopeId", "data-v-d0641039"]]);
const _sfc_main$d = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  const _component_block_box_frame = __nuxt_component_0$3;
  const _component_ui_icon = _sfc_main$f;
  _push(ssrRenderComponent(_component_block_box_frame, _attrs, {
    default: withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(ssrRenderComponent(_component_ui_icon, {
          size: "40px",
          icon: "Plus"
        }, null, _parent2, _scopeId));
      } else {
        return [
          createVNode(_component_ui_icon, {
            size: "40px",
            icon: "Plus"
          })
        ];
      }
    }),
    _: 1
  }, _parent));
}
const _sfc_setup$d = _sfc_main$d.setup;
_sfc_main$d.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/block/boxFrame/add.vue");
  return _sfc_setup$d ? _sfc_setup$d(props, ctx) : void 0;
};
const __nuxt_component_1$2 = /* @__PURE__ */ _export_sfc(_sfc_main$d, [["ssrRender", _sfc_ssrRender]]);
const _sfc_main$c = /* @__PURE__ */ defineComponent({
  __name: "clickOutside",
  __ssrInlineRender: true,
  props: {
    state: { type: Boolean, default: true },
    throttle: { default: 0 }
  },
  emits: ["trigger"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    onUnmounted(() => removeEvent());
    watch(() => props.state, (value) => {
      if (value)
        addEvent();
      else
        removeEvent();
    });
    function addEvent() {
      setTimeout(() => {
        (void 0).addEventListener("click", onClick);
      }, props.throttle);
    }
    function removeEvent() {
      (void 0).removeEventListener("click", onClick);
    }
    function onClick(event) {
      emit("trigger", event);
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "click-outside-block" }, _attrs))}>`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</div>`);
    };
  }
});
const _sfc_setup$c = _sfc_main$c.setup;
_sfc_main$c.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/block/clickOutside.vue");
  return _sfc_setup$c ? _sfc_setup$c(props, ctx) : void 0;
};
const _sfc_main$b = /* @__PURE__ */ defineComponent({
  __name: "modal",
  __ssrInlineRender: true,
  props: {
    modelValue: {}
  },
  setup(__props) {
    const props = __props;
    const hook = props.modelValue;
    return (_ctx, _push, _parent, _attrs) => {
      const _component_block_click_outside = _sfc_main$c;
      if (unref(hook).status.value) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "modal" }, _attrs))} data-v-4de057ae>`);
        _push(ssrRenderComponent(_component_block_click_outside, {
          class: "modal__content",
          onTrigger: unref(hook).hide,
          state: unref(hook).status.value
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "default", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "default", {}, void 0, true)
              ];
            }
          }),
          _: 3
        }, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$b = _sfc_main$b.setup;
_sfc_main$b.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ui/modal.vue");
  return _sfc_setup$b ? _sfc_setup$b(props, ctx) : void 0;
};
const __nuxt_component_0$1 = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["__scopeId", "data-v-4de057ae"]]);
const _sfc_main$a = /* @__PURE__ */ defineComponent({
  __name: "button",
  __ssrInlineRender: true,
  props: {
    type: {},
    icon: {},
    decor: {},
    disabled: { type: Boolean }
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ui_icon = _sfc_main$f;
      _push(`<button${ssrRenderAttrs(mergeProps({
        class: ["ui-button", { [`--${_ctx.decor}`]: _ctx.decor, "disabled": _ctx.disabled }],
        type: _ctx.type ?? "button"
      }, _attrs))} data-v-44cd4548>`);
      if (_ctx.icon) {
        _push(ssrRenderComponent(_component_ui_icon, {
          icon: _ctx.icon,
          size: "16px"
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</button>`);
    };
  }
});
const _sfc_setup$a = _sfc_main$a.setup;
_sfc_main$a.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ui/button.vue");
  return _sfc_setup$a ? _sfc_setup$a(props, ctx) : void 0;
};
const __nuxt_component_2$1 = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["__scopeId", "data-v-44cd4548"]]);
const _sfc_main$9 = /* @__PURE__ */ defineComponent({
  __name: "input",
  __ssrInlineRender: true,
  props: {
    id: {},
    modelValue: {},
    type: { default: "text" },
    autocomplete: {},
    autofocus: { type: Boolean },
    title: {},
    icon: {},
    placeholder: {},
    postIcon: {},
    disabled: { type: Boolean },
    isError: { type: Boolean }
  },
  emits: ["update:modelValue", "postIcon:click"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const innerValue = ref(props.modelValue ?? "");
    const passwordVisible = ref(false);
    const inputRef = ref();
    const typeComputed = computed(() => {
      return props.type === "password" ? passwordVisible.value ? "text" : "password" : props.type;
    });
    watch(() => props.modelValue, (value) => innerValue.value = value);
    watch(innerValue, (value) => emit("update:modelValue", value));
    const classesInput = reactive({
      "--icon": props.icon,
      "--is-text": computed(() => innerValue.value.length),
      "--post-icon": props.postIcon || props.type === "password"
    });
    function postIconClick() {
      emit("postIcon:click", inputRef.value);
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ui_icon = _sfc_main$f;
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["ui-input", { "ui-input--error": _ctx.isError }]
      }, _attrs))} data-v-cc266375><input class="${ssrRenderClass(unref(classesInput))}"${ssrRenderAttr("id", `input-${_ctx.id}`)}${ssrRenderAttr("type", unref(typeComputed))}${ssrRenderAttr("value", unref(innerValue))}${ssrRenderAttr("placeholder", _ctx.placeholder)}${ssrRenderAttr("autocomplete", _ctx.autocomplete ?? "off")}${ssrIncludeBooleanAttr(_ctx.disabled) ? " disabled" : ""}${ssrRenderDynamicModel(unref(typeComputed), unref(innerValue), unref(innerValue))} data-v-cc266375>`);
      if (_ctx.title) {
        _push(`<label class="ui-input__placeholder"${ssrRenderAttr("for", `input-${_ctx.id}`)} data-v-cc266375>${ssrInterpolate(_ctx.title)}</label>`);
      } else {
        _push(`<!---->`);
      }
      if (_ctx.type === "password") {
        _push(`<label class="ui-input__icon --pass"${ssrRenderAttr("for", `input-${_ctx.id}`)} data-v-cc266375>`);
        if (unref(passwordVisible)) {
          _push(ssrRenderComponent(_component_ui_icon, {
            size: "20px",
            icon: "EyeOff"
          }, null, _parent));
        } else {
          _push(ssrRenderComponent(_component_ui_icon, {
            size: "20px",
            icon: "Eye"
          }, null, _parent));
        }
        _push(`</label>`);
      } else {
        _push(`<!---->`);
      }
      if (_ctx.icon) {
        _push(`<label class="ui-input__icon --type"${ssrRenderAttr("for", `input-${_ctx.id}`)} data-v-cc266375>`);
        _push(ssrRenderComponent(_component_ui_icon, {
          size: "20px",
          icon: _ctx.icon
        }, null, _parent));
        _push(`</label>`);
      } else {
        _push(`<!---->`);
      }
      if (_ctx.postIcon && _ctx.type !== "password") {
        _push(`<label class="ui-input__icon --post"${ssrRenderAttr("for", `input-${_ctx.id}`)} data-v-cc266375>`);
        _push(ssrRenderComponent(_component_ui_icon, {
          icon: _ctx.postIcon,
          onClick: postIconClick
        }, null, _parent));
        _push(`</label>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$9 = _sfc_main$9.setup;
_sfc_main$9.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ui/input.vue");
  return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
const __nuxt_component_1$1 = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["__scopeId", "data-v-cc266375"]]);
const _sfc_main$8 = /* @__PURE__ */ defineComponent({
  __name: "checkbox",
  __ssrInlineRender: true,
  props: {
    id: {},
    modelValue: {},
    isRounded: { type: Boolean },
    title: {},
    disabled: { type: Boolean, default: false }
  },
  emits: ["update:modelValue", "change", "check", "uncheck"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const innerValue = ref(getValueWithType(props.modelValue ?? false));
    watch(() => props.modelValue, (value, oldValue) => {
      if (innerValue.value !== getValueWithType(value) && oldValue !== void 0) {
        innerValue.value = value;
      }
    });
    function getValueWithType(value) {
      const isNumber = typeof value === "number";
      const isString = typeof value === "string";
      return isNumber ? Boolean(value) : isString ? value === "on" : value;
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["checkbox", {
          "--disabled": _ctx.disabled,
          "--radio": _ctx.isRounded
        }]
      }, _attrs))} data-v-01329cf0><input${ssrRenderAttr("id", _ctx.id)} type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(unref(innerValue)) ? ssrLooseContain(unref(innerValue), null) : unref(innerValue)) ? " checked" : ""} data-v-01329cf0><label${ssrRenderAttr("for", _ctx.id)} class="checkbox__check" data-v-01329cf0><span style="${ssrRenderStyle({ "opacity": unref(innerValue) ? 1 : 0 })}" data-v-01329cf0></span></label>`);
      if (_ctx.title) {
        _push(`<label${ssrRenderAttr("for", _ctx.id)} class="checkbox__title" data-v-01329cf0><span data-v-01329cf0>${ssrInterpolate(_ctx.title)}</span></label>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$8 = _sfc_main$8.setup;
_sfc_main$8.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ui/checkbox.vue");
  return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
const __nuxt_component_3$1 = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["__scopeId", "data-v-01329cf0"]]);
const _sfc_main$7 = /* @__PURE__ */ defineComponent({
  __name: "createModal",
  __ssrInlineRender: true,
  props: {
    modelValue: {},
    extended: { type: Boolean }
  },
  emits: ["create"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const modal = props.modelValue;
    let idIndent = 0;
    const createBoxData = reactive({
      title: "",
      random: true,
      content: []
    });
    const isDataCorrect = computed(() => createBoxData.title.length && createBoxData.content.every((el) => el.title.length));
    watch(modal.status, (value) => {
      if (!value) {
        idIndent = 0;
        createBoxData.title = "";
        createBoxData.random = true;
        createBoxData.content.splice(0);
      }
    });
    function addContent() {
      const content = createBoxData.content;
      const newId = idIndent++;
      content.push({
        id: newId,
        title: `Content #${newId}`
      });
    }
    function deleteContent(id) {
      const content = createBoxData.content;
      content.splice(content.findIndex((el) => el.id === id), 1);
    }
    function createBox() {
      emit("create", JSON.parse(JSON.stringify(createBoxData)));
      modal.hide();
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ui_modal = __nuxt_component_0$1;
      const _component_ui_button = __nuxt_component_2$1;
      const _component_ui_input = __nuxt_component_1$1;
      const _component_ui_checkbox = __nuxt_component_3$1;
      const _component_ui_icon = _sfc_main$f;
      _push(ssrRenderComponent(_component_ui_modal, mergeProps({
        modelValue: unref(modal),
        "onUpdate:modelValue": ($event) => isRef(modal) ? modal.value = $event : null
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="modal-create" data-v-50a0580c${_scopeId}><div class="modal-create__header" data-v-50a0580c${_scopeId}><h2 data-v-50a0580c${_scopeId}>Создание коробки</h2>`);
            _push2(ssrRenderComponent(_component_ui_button, {
              disabled: !unref(isDataCorrect),
              decor: "green",
              onClick: createBox
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(` Создать `);
                } else {
                  return [
                    createTextVNode(" Создать ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div><div class="modal-create__data" data-v-50a0580c${_scopeId}>`);
            _push2(ssrRenderComponent(_component_ui_input, {
              id: "name",
              title: "Название",
              placeholder: "Минимум 1 символ",
              modelValue: unref(createBoxData).title,
              "onUpdate:modelValue": ($event) => unref(createBoxData).title = $event
            }, null, _parent2, _scopeId));
            if (_ctx.extended) {
              _push2(ssrRenderComponent(_component_ui_checkbox, {
                id: "is-random",
                title: "Случайное выпадение",
                modelValue: unref(createBoxData).random,
                "onUpdate:modelValue": ($event) => unref(createBoxData).random = $event
              }, null, _parent2, _scopeId));
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="modal-create__data__content-header" data-v-50a0580c${_scopeId}><h3 data-v-50a0580c${_scopeId}>Содержание</h3>`);
            _push2(ssrRenderComponent(_component_ui_icon, {
              size: "24px",
              icon: "Plus",
              onClick: addContent
            }, null, _parent2, _scopeId));
            _push2(`</div>`);
            if (unref(createBoxData).content.length) {
              _push2(ssrRenderComponent(unref(draggable), {
                list: unref(createBoxData).content,
                "item-key": "id",
                class: "modal-create__data__content",
                "ghost-class": "modal-create__data__content__row--ghost",
                handle: ".modal-create__data__content__row__handle"
              }, {
                item: withCtx(({ element }, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="modal-create__data__content__row" data-v-50a0580c${_scopeId2}>`);
                    if (_ctx.extended) {
                      _push3(`<div class="modal-create__data__content__row__handle" data-v-50a0580c${_scopeId2}>`);
                      _push3(ssrRenderComponent(_component_ui_icon, {
                        icon: "Handle",
                        size: "22px"
                      }, null, _parent3, _scopeId2));
                      _push3(`</div>`);
                    } else {
                      _push3(`<!---->`);
                    }
                    _push3(`<div class="modal-create__data__content__row__title" data-v-50a0580c${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_ui_input, {
                      id: element.id,
                      placeholder: "Минимум 1 символ",
                      modelValue: element.title,
                      "onUpdate:modelValue": ($event) => element.title = $event
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><div class="modal-create__data__content__row__delete" data-v-50a0580c${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_ui_icon, {
                      icon: "Bin",
                      size: "18px",
                      onClick: ($event) => deleteContent(element.id)
                    }, null, _parent3, _scopeId2));
                    _push3(`</div></div>`);
                  } else {
                    return [
                      createVNode("div", { class: "modal-create__data__content__row" }, [
                        _ctx.extended ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "modal-create__data__content__row__handle"
                        }, [
                          createVNode(_component_ui_icon, {
                            icon: "Handle",
                            size: "22px"
                          })
                        ])) : createCommentVNode("", true),
                        createVNode("div", { class: "modal-create__data__content__row__title" }, [
                          createVNode(_component_ui_input, {
                            id: element.id,
                            placeholder: "Минимум 1 символ",
                            modelValue: element.title,
                            "onUpdate:modelValue": ($event) => element.title = $event
                          }, null, 8, ["id", "modelValue", "onUpdate:modelValue"])
                        ]),
                        createVNode("div", { class: "modal-create__data__content__row__delete" }, [
                          createVNode(_component_ui_icon, {
                            icon: "Bin",
                            size: "18px",
                            onClick: ($event) => deleteContent(element.id)
                          }, null, 8, ["onClick"])
                        ])
                      ])
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
            } else {
              _push2(`<div data-v-50a0580c${_scopeId}><div class="modal-create__data__content--null" data-v-50a0580c${_scopeId}> Список пуст </div></div>`);
            }
            _push2(`</div></div>`);
          } else {
            return [
              createVNode("div", { class: "modal-create" }, [
                createVNode("div", { class: "modal-create__header" }, [
                  createVNode("h2", null, "Создание коробки"),
                  createVNode(_component_ui_button, {
                    disabled: !unref(isDataCorrect),
                    decor: "green",
                    onClick: createBox
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Создать ")
                    ]),
                    _: 1
                  }, 8, ["disabled"])
                ]),
                createVNode("div", { class: "modal-create__data" }, [
                  createVNode(_component_ui_input, {
                    id: "name",
                    title: "Название",
                    placeholder: "Минимум 1 символ",
                    modelValue: unref(createBoxData).title,
                    "onUpdate:modelValue": ($event) => unref(createBoxData).title = $event
                  }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                  _ctx.extended ? (openBlock(), createBlock(_component_ui_checkbox, {
                    key: 0,
                    id: "is-random",
                    title: "Случайное выпадение",
                    modelValue: unref(createBoxData).random,
                    "onUpdate:modelValue": ($event) => unref(createBoxData).random = $event
                  }, null, 8, ["modelValue", "onUpdate:modelValue"])) : createCommentVNode("", true),
                  createVNode("div", { class: "modal-create__data__content-header" }, [
                    createVNode("h3", null, "Содержание"),
                    createVNode(_component_ui_icon, {
                      size: "24px",
                      icon: "Plus",
                      onClick: addContent
                    })
                  ]),
                  unref(createBoxData).content.length ? (openBlock(), createBlock(unref(draggable), {
                    key: 1,
                    list: unref(createBoxData).content,
                    "item-key": "id",
                    class: "modal-create__data__content",
                    "ghost-class": "modal-create__data__content__row--ghost",
                    handle: ".modal-create__data__content__row__handle"
                  }, {
                    item: withCtx(({ element }) => [
                      createVNode("div", { class: "modal-create__data__content__row" }, [
                        _ctx.extended ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "modal-create__data__content__row__handle"
                        }, [
                          createVNode(_component_ui_icon, {
                            icon: "Handle",
                            size: "22px"
                          })
                        ])) : createCommentVNode("", true),
                        createVNode("div", { class: "modal-create__data__content__row__title" }, [
                          createVNode(_component_ui_input, {
                            id: element.id,
                            placeholder: "Минимум 1 символ",
                            modelValue: element.title,
                            "onUpdate:modelValue": ($event) => element.title = $event
                          }, null, 8, ["id", "modelValue", "onUpdate:modelValue"])
                        ]),
                        createVNode("div", { class: "modal-create__data__content__row__delete" }, [
                          createVNode(_component_ui_icon, {
                            icon: "Bin",
                            size: "18px",
                            onClick: ($event) => deleteContent(element.id)
                          }, null, 8, ["onClick"])
                        ])
                      ])
                    ]),
                    _: 1
                  }, 8, ["list"])) : (openBlock(), createBlock("div", { key: 2 }, [
                    createVNode("div", { class: "modal-create__data__content--null" }, " Список пуст ")
                  ]))
                ])
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/frame/createModal.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const __nuxt_component_2 = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["__scopeId", "data-v-50a0580c"]]);
const _sfc_main$6 = /* @__PURE__ */ defineComponent({
  __name: "editModal",
  __ssrInlineRender: true,
  props: {
    data: {},
    modelValue: {},
    extended: { type: Boolean }
  },
  emits: ["save"],
  setup(__props, { emit: __emit }) {
    var _a, _b;
    const props = __props;
    const emit = __emit;
    const modal = props.modelValue;
    let idIndent = (_b = (_a = props.data) == null ? void 0 : _a.content) == null ? void 0 : _b.length;
    const editBoxData = reactive(props.data ?? {});
    const isDataCorrect = computed(() => editBoxData.title.length && editBoxData.content.every((el) => el.title.length));
    watch(props.data, (value) => {
      Object.assign(editBoxData, value);
      idIndent = value.content.length;
    });
    function addContent() {
      const content = editBoxData.content;
      const newId = idIndent++;
      content.push({
        id: newId,
        title: `Content #${newId}`
      });
    }
    function deleteContent(id) {
      const content = editBoxData.content;
      content.splice(content.findIndex((el) => el.id === id), 1);
    }
    function saveBox() {
      emit("save", { ...editBoxData });
      modal.hide();
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ui_modal = __nuxt_component_0$1;
      const _component_ui_button = __nuxt_component_2$1;
      const _component_ui_input = __nuxt_component_1$1;
      const _component_ui_checkbox = __nuxt_component_3$1;
      const _component_ui_icon = _sfc_main$f;
      _push(ssrRenderComponent(_component_ui_modal, mergeProps({
        modelValue: unref(modal),
        "onUpdate:modelValue": ($event) => isRef(modal) ? modal.value = $event : null
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="modal-edit" data-v-d0105e36${_scopeId}><div class="modal-edit__header" data-v-d0105e36${_scopeId}><h2 data-v-d0105e36${_scopeId}>Редактирование коробки</h2>`);
            _push2(ssrRenderComponent(_component_ui_button, {
              disabled: !unref(isDataCorrect),
              decor: "green",
              onClick: saveBox
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(` Сохранить `);
                } else {
                  return [
                    createTextVNode(" Сохранить ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div><div class="modal-edit__data" data-v-d0105e36${_scopeId}>`);
            _push2(ssrRenderComponent(_component_ui_input, {
              id: "name",
              title: "Название",
              placeholder: "Минимум 1 символ",
              modelValue: unref(editBoxData).title,
              "onUpdate:modelValue": ($event) => unref(editBoxData).title = $event
            }, null, _parent2, _scopeId));
            if (_ctx.extended) {
              _push2(ssrRenderComponent(_component_ui_checkbox, {
                id: "is-random",
                title: "Случайное выпадение",
                modelValue: unref(editBoxData).random,
                "onUpdate:modelValue": ($event) => unref(editBoxData).random = $event
              }, null, _parent2, _scopeId));
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="modal-edit__data__content-header" data-v-d0105e36${_scopeId}><h3 data-v-d0105e36${_scopeId}>Содержание</h3>`);
            _push2(ssrRenderComponent(_component_ui_icon, {
              size: "24px",
              icon: "Plus",
              onClick: addContent
            }, null, _parent2, _scopeId));
            _push2(`</div>`);
            if (unref(editBoxData).content.length) {
              _push2(ssrRenderComponent(unref(draggable), {
                list: unref(editBoxData).content,
                "item-key": "id",
                class: "modal-edit__data__content",
                "ghost-class": "modal-edit__data__content__row--ghost",
                handle: ".modal-edit__data__content__row__handle"
              }, {
                item: withCtx(({ element }, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="modal-edit__data__content__row" data-v-d0105e36${_scopeId2}>`);
                    if (_ctx.extended) {
                      _push3(`<div class="modal-edit__data__content__row__handle" data-v-d0105e36${_scopeId2}>`);
                      _push3(ssrRenderComponent(_component_ui_icon, {
                        icon: "Handle",
                        size: "22px"
                      }, null, _parent3, _scopeId2));
                      _push3(`</div>`);
                    } else {
                      _push3(`<!---->`);
                    }
                    _push3(`<div class="modal-edit__data__content__row__title" data-v-d0105e36${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_ui_input, {
                      id: element.id,
                      placeholder: "Минимум 1 символ",
                      modelValue: element.title,
                      "onUpdate:modelValue": ($event) => element.title = $event
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><div class="modal-edit__data__content__row__delete" data-v-d0105e36${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_ui_icon, {
                      icon: "Bin",
                      size: "18px",
                      onClick: ($event) => deleteContent(element.id)
                    }, null, _parent3, _scopeId2));
                    _push3(`</div></div>`);
                  } else {
                    return [
                      createVNode("div", { class: "modal-edit__data__content__row" }, [
                        _ctx.extended ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "modal-edit__data__content__row__handle"
                        }, [
                          createVNode(_component_ui_icon, {
                            icon: "Handle",
                            size: "22px"
                          })
                        ])) : createCommentVNode("", true),
                        createVNode("div", { class: "modal-edit__data__content__row__title" }, [
                          createVNode(_component_ui_input, {
                            id: element.id,
                            placeholder: "Минимум 1 символ",
                            modelValue: element.title,
                            "onUpdate:modelValue": ($event) => element.title = $event
                          }, null, 8, ["id", "modelValue", "onUpdate:modelValue"])
                        ]),
                        createVNode("div", { class: "modal-edit__data__content__row__delete" }, [
                          createVNode(_component_ui_icon, {
                            icon: "Bin",
                            size: "18px",
                            onClick: ($event) => deleteContent(element.id)
                          }, null, 8, ["onClick"])
                        ])
                      ])
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
            } else {
              _push2(`<div data-v-d0105e36${_scopeId}><div class="modal-edit__data__content--null" data-v-d0105e36${_scopeId}> Список пуст </div></div>`);
            }
            _push2(`</div></div>`);
          } else {
            return [
              createVNode("div", { class: "modal-edit" }, [
                createVNode("div", { class: "modal-edit__header" }, [
                  createVNode("h2", null, "Редактирование коробки"),
                  createVNode(_component_ui_button, {
                    disabled: !unref(isDataCorrect),
                    decor: "green",
                    onClick: saveBox
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Сохранить ")
                    ]),
                    _: 1
                  }, 8, ["disabled"])
                ]),
                createVNode("div", { class: "modal-edit__data" }, [
                  createVNode(_component_ui_input, {
                    id: "name",
                    title: "Название",
                    placeholder: "Минимум 1 символ",
                    modelValue: unref(editBoxData).title,
                    "onUpdate:modelValue": ($event) => unref(editBoxData).title = $event
                  }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                  _ctx.extended ? (openBlock(), createBlock(_component_ui_checkbox, {
                    key: 0,
                    id: "is-random",
                    title: "Случайное выпадение",
                    modelValue: unref(editBoxData).random,
                    "onUpdate:modelValue": ($event) => unref(editBoxData).random = $event
                  }, null, 8, ["modelValue", "onUpdate:modelValue"])) : createCommentVNode("", true),
                  createVNode("div", { class: "modal-edit__data__content-header" }, [
                    createVNode("h3", null, "Содержание"),
                    createVNode(_component_ui_icon, {
                      size: "24px",
                      icon: "Plus",
                      onClick: addContent
                    })
                  ]),
                  unref(editBoxData).content.length ? (openBlock(), createBlock(unref(draggable), {
                    key: 1,
                    list: unref(editBoxData).content,
                    "item-key": "id",
                    class: "modal-edit__data__content",
                    "ghost-class": "modal-edit__data__content__row--ghost",
                    handle: ".modal-edit__data__content__row__handle"
                  }, {
                    item: withCtx(({ element }) => [
                      createVNode("div", { class: "modal-edit__data__content__row" }, [
                        _ctx.extended ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "modal-edit__data__content__row__handle"
                        }, [
                          createVNode(_component_ui_icon, {
                            icon: "Handle",
                            size: "22px"
                          })
                        ])) : createCommentVNode("", true),
                        createVNode("div", { class: "modal-edit__data__content__row__title" }, [
                          createVNode(_component_ui_input, {
                            id: element.id,
                            placeholder: "Минимум 1 символ",
                            modelValue: element.title,
                            "onUpdate:modelValue": ($event) => element.title = $event
                          }, null, 8, ["id", "modelValue", "onUpdate:modelValue"])
                        ]),
                        createVNode("div", { class: "modal-edit__data__content__row__delete" }, [
                          createVNode(_component_ui_icon, {
                            icon: "Bin",
                            size: "18px",
                            onClick: ($event) => deleteContent(element.id)
                          }, null, 8, ["onClick"])
                        ])
                      ])
                    ]),
                    _: 1
                  }, 8, ["list"])) : (openBlock(), createBlock("div", { key: 2 }, [
                    createVNode("div", { class: "modal-edit__data__content--null" }, " Список пуст ")
                  ]))
                ])
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/frame/editModal.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const __nuxt_component_3 = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["__scopeId", "data-v-d0105e36"]]);
const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  __name: "infoModal",
  __ssrInlineRender: true,
  props: {
    data: {},
    results: {},
    modelValue: {}
  },
  emits: ["drop", "clean", "delete"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const modal = props.modelValue;
    const infoBoxData = reactive(props.data ?? {});
    const currentResults = computed(() => props.results.filter((result) => result.boxId === infoBoxData.id));
    const contentObject = computed(() => {
      var _a;
      return (_a = infoBoxData.content) == null ? void 0 : _a.reduce((accum, current) => {
        accum[current.id] = current.title;
        return accum;
      }, {});
    });
    watch(props.data, (value) => {
      Object.assign(infoBoxData, value);
    });
    function deleteBox() {
      if (!confirm("Вы уверены?"))
        return;
      emit("delete", infoBoxData.id);
      modal.hide();
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ui_modal = __nuxt_component_0$1;
      const _component_ui_input = __nuxt_component_1$1;
      const _component_ui_button = __nuxt_component_2$1;
      _push(ssrRenderComponent(_component_ui_modal, mergeProps({
        modelValue: unref(modal),
        "onUpdate:modelValue": ($event) => isRef(modal) ? modal.value = $event : null
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="modal-info" data-v-b1cd6d74${_scopeId}><div class="modal-info__header" data-v-b1cd6d74${_scopeId}><h2 data-v-b1cd6d74${_scopeId}>Информация о коробке</h2></div><div class="modal-info__data" data-v-b1cd6d74${_scopeId}>`);
            _push2(ssrRenderComponent(_component_ui_input, {
              id: "name",
              title: "Название",
              disabled: "",
              placeholder: "Минимум 1 символ",
              modelValue: unref(infoBoxData).title,
              "onUpdate:modelValue": ($event) => unref(infoBoxData).title = $event
            }, null, _parent2, _scopeId));
            _push2(`<div class="table" data-v-b1cd6d74${_scopeId}><div class="table__column" data-v-b1cd6d74${_scopeId}><div class="table__column__header" data-v-b1cd6d74${_scopeId}>Содержание</div><div class="table__column__content" data-v-b1cd6d74${_scopeId}>`);
            if (_ctx.data.content.length) {
              _push2(`<!--[-->`);
              ssrRenderList(_ctx.data.content, (row) => {
                _push2(`<div class="${ssrRenderClass([{ "table__column__content__row--has": unref(currentResults).find((result) => result.contentId === row.id) }, "table__column__content__row"])}" data-v-b1cd6d74${_scopeId}>${ssrInterpolate(row.title)}</div>`);
              });
              _push2(`<!--]-->`);
            } else {
              _push2(`<div class="table__column__content__row table__column__content__row--null" data-v-b1cd6d74${_scopeId}> Пусто </div>`);
            }
            _push2(`</div></div><div class="table__column" data-v-b1cd6d74${_scopeId}><div class="table__column__header" data-v-b1cd6d74${_scopeId}>Выпадения</div><div class="table__column__content" data-v-b1cd6d74${_scopeId}>`);
            if (unref(currentResults).length) {
              _push2(`<!--[-->`);
              ssrRenderList(unref(currentResults), (row, index) => {
                _push2(`<div class="${ssrRenderClass([{ "table__column__content__row--bold": !index }, "table__column__content__row"])}" data-v-b1cd6d74${_scopeId}>${ssrInterpolate(unref(contentObject)[row.contentId])}</div>`);
              });
              _push2(`<!--]-->`);
            } else {
              _push2(`<div class="table__column__content__row table__column__content__row--null" data-v-b1cd6d74${_scopeId}> Пусто </div>`);
            }
            _push2(`</div></div></div><div class="modal-info__data__actions" data-v-b1cd6d74${_scopeId}>`);
            _push2(ssrRenderComponent(_component_ui_button, {
              decor: "red",
              onClick: deleteBox
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(` Удалить `);
                } else {
                  return [
                    createTextVNode(" Удалить ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_ui_button, {
              decor: "green",
              disabled: unref(infoBoxData).content.length === unref(currentResults).length,
              onClick: ($event) => emit("drop", unref(infoBoxData).id)
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(` Крутить `);
                } else {
                  return [
                    createTextVNode(" Крутить ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_ui_button, {
              disabled: !unref(currentResults).length,
              onClick: ($event) => emit("clean", unref(infoBoxData).id)
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(` Очистить `);
                } else {
                  return [
                    createTextVNode(" Очистить ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div></div></div>`);
          } else {
            return [
              createVNode("div", { class: "modal-info" }, [
                createVNode("div", { class: "modal-info__header" }, [
                  createVNode("h2", null, "Информация о коробке")
                ]),
                createVNode("div", { class: "modal-info__data" }, [
                  createVNode(_component_ui_input, {
                    id: "name",
                    title: "Название",
                    disabled: "",
                    placeholder: "Минимум 1 символ",
                    modelValue: unref(infoBoxData).title,
                    "onUpdate:modelValue": ($event) => unref(infoBoxData).title = $event
                  }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                  createVNode("div", { class: "table" }, [
                    createVNode("div", { class: "table__column" }, [
                      createVNode("div", { class: "table__column__header" }, "Содержание"),
                      createVNode("div", { class: "table__column__content" }, [
                        _ctx.data.content.length ? (openBlock(true), createBlock(Fragment, { key: 0 }, renderList(_ctx.data.content, (row) => {
                          return openBlock(), createBlock("div", {
                            class: ["table__column__content__row", { "table__column__content__row--has": unref(currentResults).find((result) => result.contentId === row.id) }],
                            key: row.id
                          }, toDisplayString(row.title), 3);
                        }), 128)) : (openBlock(), createBlock("div", {
                          key: 1,
                          class: "table__column__content__row table__column__content__row--null"
                        }, " Пусто "))
                      ])
                    ]),
                    createVNode("div", { class: "table__column" }, [
                      createVNode("div", { class: "table__column__header" }, "Выпадения"),
                      createVNode("div", { class: "table__column__content" }, [
                        unref(currentResults).length ? (openBlock(true), createBlock(Fragment, { key: 0 }, renderList(unref(currentResults), (row, index) => {
                          return openBlock(), createBlock("div", {
                            class: ["table__column__content__row", { "table__column__content__row--bold": !index }],
                            key: row
                          }, toDisplayString(unref(contentObject)[row.contentId]), 3);
                        }), 128)) : (openBlock(), createBlock("div", {
                          key: 1,
                          class: "table__column__content__row table__column__content__row--null"
                        }, " Пусто "))
                      ])
                    ])
                  ]),
                  createVNode("div", { class: "modal-info__data__actions" }, [
                    createVNode(_component_ui_button, {
                      decor: "red",
                      onClick: deleteBox
                    }, {
                      default: withCtx(() => [
                        createTextVNode(" Удалить ")
                      ]),
                      _: 1
                    }),
                    createVNode(_component_ui_button, {
                      decor: "green",
                      disabled: unref(infoBoxData).content.length === unref(currentResults).length,
                      onClick: ($event) => emit("drop", unref(infoBoxData).id)
                    }, {
                      default: withCtx(() => [
                        createTextVNode(" Крутить ")
                      ]),
                      _: 1
                    }, 8, ["disabled", "onClick"]),
                    createVNode(_component_ui_button, {
                      disabled: !unref(currentResults).length,
                      onClick: ($event) => emit("clean", unref(infoBoxData).id)
                    }, {
                      default: withCtx(() => [
                        createTextVNode(" Очистить ")
                      ]),
                      _: 1
                    }, 8, ["disabled", "onClick"])
                  ])
                ])
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/frame/infoModal.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const __nuxt_component_4 = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["__scopeId", "data-v-b1cd6d74"]]);
function useSwitch(config) {
  const currentStatus = ref((config == null ? void 0 : config.defaultStatus) ?? false);
  const minHideDelay = (config == null ? void 0 : config.minSwitchStatusDelay) ?? 500;
  let showTimeStamp = 0;
  let hideDelay;
  function show() {
    currentStatus.value = true;
    showTimeStamp = Date.now();
    clearTimeout(hideDelay);
  }
  function hide() {
    const delay = minHideDelay - (Date.now() - showTimeStamp);
    hideDelay = setTimeout(() => {
      currentStatus.value = false;
    }, delay < 0 ? 0 : delay);
  }
  return {
    show,
    hide,
    status: currentStatus,
    delay: minHideDelay
  };
}
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "boxes",
  __ssrInlineRender: true,
  props: {
    isEdit: { type: Boolean },
    modelValue: {}
  },
  setup(__props) {
    const props = __props;
    const boxesStore = props.modelValue;
    const isEdit = props.isEdit;
    const createModal = useSwitch();
    const editModal = useSwitch();
    const infoModal = useSwitch();
    const modalData = reactive({});
    const extended = ref(false);
    function createBox(_extended = false) {
      extended.value = _extended;
      createModal.show();
    }
    function editBox(id, _extended = false) {
      extended.value = _extended;
      Object.assign(modalData, boxesStore.getBoxById(id));
      editModal.show();
    }
    function infoBox(id) {
      Object.assign(modalData, boxesStore.getBoxById(id));
      infoModal.show();
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_block_box_frame_box = __nuxt_component_0$2;
      const _component_block_box_frame_add = __nuxt_component_1$2;
      const _component_frame_create_modal = __nuxt_component_2;
      const _component_frame_edit_modal = __nuxt_component_3;
      const _component_frame_info_modal = __nuxt_component_4;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "boxes" }, _attrs))} data-v-f8f26da9>`);
      if (unref(boxesStore).boxes.length) {
        _push(`<!--[-->`);
        ssrRenderList(unref(boxesStore).boxes, (box) => {
          _push(ssrRenderComponent(_component_block_box_frame_box, {
            "is-edit": unref(isEdit),
            key: box.id,
            modelValue: box,
            "is-content-null": unref(boxesStore).isDropContentNull(box.id),
            onDelete: ($event) => unref(boxesStore).deleteBox($event),
            onEdit: ($event) => editBox($event),
            onEditExtended: ($event) => editBox($event, true),
            onDrop: ($event) => unref(boxesStore).dropResultFromBox($event),
            onInfo: ($event) => infoBox($event)
          }, null, _parent));
        });
        _push(`<!--]-->`);
      } else if (!unref(isEdit)) {
        _push(`<div class="boxes__null" data-v-f8f26da9><h2 data-v-f8f26da9>Нет коробок!</h2><p data-v-f8f26da9>Добавьте &#39;/?edit=true&#39; в адресной строке</p></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(isEdit)) {
        _push(`<!--[-->`);
        _push(ssrRenderComponent(_component_block_box_frame_add, {
          onClick: [($event) => createBox(), ($event) => createBox(true)]
        }, null, _parent));
        _push(ssrRenderComponent(_component_frame_create_modal, {
          extended: unref(extended),
          modelValue: unref(createModal),
          "onUpdate:modelValue": ($event) => isRef(createModal) ? createModal.value = $event : null,
          onCreate: ($event) => unref(boxesStore).createBox($event)
        }, null, _parent));
        _push(ssrRenderComponent(_component_frame_edit_modal, {
          extended: unref(extended),
          data: unref(modalData),
          modelValue: unref(editModal),
          "onUpdate:modelValue": ($event) => isRef(editModal) ? editModal.value = $event : null,
          onSave: ($event) => unref(boxesStore).updateBox($event)
        }, null, _parent));
        _push(`<!--]-->`);
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_component_frame_info_modal, {
        data: unref(modalData),
        results: unref(boxesStore).results,
        modelValue: unref(infoModal),
        "onUpdate:modelValue": ($event) => isRef(infoModal) ? infoModal.value = $event : null,
        onDrop: ($event) => unref(boxesStore).dropResultFromBox($event),
        onClean: ($event) => unref(boxesStore).cleanResultsInBox($event),
        onDelete: ($event) => unref(boxesStore).deleteBox($event)
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/frame/boxes.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["__scopeId", "data-v-f8f26da9"]]);
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "results",
  __ssrInlineRender: true,
  props: {
    isEdit: { type: Boolean },
    modelValue: {}
  },
  setup(__props) {
    useRouter();
    const props = __props;
    const boxesStore = props.modelValue;
    const isEdit = props.isEdit;
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ui_icon = _sfc_main$f;
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["results", { "results--edit": unref(isEdit) }]
      }, _attrs))} data-v-3d2db5b1><div class="results__header" data-v-3d2db5b1><div class="wrap" data-v-3d2db5b1><h2 data-v-3d2db5b1>${ssrInterpolate(unref(isEdit) ? "Редактор" : "Результаты")}</h2><div class="results__header__actions" data-v-3d2db5b1><div class="${ssrRenderClass([{ "results__header__actions__button--disabled": !unref(boxesStore).boxes.length }, "results__header__actions__button"])}" data-v-3d2db5b1>`);
      _push(ssrRenderComponent(_component_ui_icon, {
        size: "24px",
        icon: "BoxesDelete"
      }, null, _parent));
      _push(`</div>`);
      if (!unref(isEdit)) {
        _push(`<div class="${ssrRenderClass([{ "results__header__actions__button--disabled": !unref(boxesStore).results.length }, "results__header__actions__button"])}" data-v-3d2db5b1>`);
        _push(ssrRenderComponent(_component_ui_icon, {
          size: "24px",
          icon: "Restart"
        }, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(isEdit)) {
        _push(`<div class="results__header__actions__button" data-v-3d2db5b1>`);
        _push(ssrRenderComponent(_component_ui_icon, {
          size: "24px",
          icon: "Times"
        }, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div><div class="results__content" data-v-3d2db5b1><!--[-->`);
      ssrRenderList(unref(boxesStore).results, (row, index) => {
        _push(`<div class="${ssrRenderClass([{ "results__content__row--bold": !index }, "results__content__row"])}" data-v-3d2db5b1>${ssrInterpolate(unref(boxesStore).getTitleByResult(row))}</div>`);
      });
      _push(`<!--]-->`);
      if (!unref(boxesStore).results.length) {
        _push(`<div class="results__content__null" data-v-3d2db5b1> Пусто </div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/frame/results.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const __nuxt_component_1 = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["__scopeId", "data-v-3d2db5b1"]]);
const useBoxesStore = defineStore("boxes", () => {
  const nuxt = /* @__PURE__ */ useNuxtApp();
  const storageName = "boxesStorage";
  const boxes = reactive([]);
  const results = reactive([]);
  let resultsIndent = 0;
  const saveBoxes = () => {
    localStorage.setItem(storageName, JSON.stringify(boxes));
  };
  const readBoxes = () => {
    const savedData = localStorage.getItem(storageName);
    if (!savedData)
      return;
    Object.assign(boxes, JSON.parse(savedData));
  };
  const createBox = (data) => {
    boxes.push({
      id: boxes.length ? boxes.at(-1).id + 1 : 0,
      ...data
    });
    return boxes.at(-1);
  };
  const updateBox = (data) => {
    Object.assign(boxes[boxes.findIndex((box) => box.id === data.id)], data);
    return data;
  };
  const deleteBox = (id) => {
    return boxes.splice(boxes.findIndex((el) => el.id === id), 1)[0];
  };
  const getBoxById = (id) => {
    return boxes.find((el) => el.id === id);
  };
  const dropResultFromBox = (id) => {
    const box = getBoxById(id);
    const boxResults = results.filter((result) => result.boxId === (box == null ? void 0 : box.id));
    if (!box || box.content.length <= boxResults.length)
      return;
    const filteredContend = box.content.filter((el) => !boxResults.find((result) => result.contentId === el.id));
    if (box.random) {
      const randContent = filteredContend.splice(Math.floor(Math.random() * filteredContend.length), 1)[0];
      results.unshift({ id: resultsIndent++, boxId: box.id, contentId: randContent.id });
    } else {
      const topContent = filteredContend.splice(0, 1)[0];
      results.unshift({ id: resultsIndent++, boxId: box.id, contentId: topContent.id });
    }
    return results[results.length - 1];
  };
  const isDropContentNull = (id) => {
    const box = getBoxById(id);
    const boxContent = results.filter((result) => result.boxId === (box == null ? void 0 : box.id));
    return !(box.content.length - boxContent.length);
  };
  const cleanResultsInBox = (id) => {
    const withoutBoxResults = results.filter((result) => result.boxId !== id);
    results.splice(0);
    Object.assign(results, withoutBoxResults);
  };
  const deleteAllBoxes = () => {
    cleanAllResults();
    boxes.splice(0);
  };
  const cleanAllResults = () => {
    results.splice(0);
  };
  const getTitleByResult = (data) => {
    const box = boxes.find((box2) => box2.id === data.boxId);
    const content = box == null ? void 0 : box.content.find((content2) => content2.id === data.contentId);
    if (!box || !content)
      return "";
    return `[${box.title}] ${content.title}`;
  };
  nuxt.hook("app:mounted", () => readBoxes());
  watch(boxes, () => saveBoxes());
  const computeds = {
    boxes: computed$1(() => boxes),
    results: computed$1(() => results)
  };
  const functions = {
    createBox,
    updateBox,
    deleteBox,
    getBoxById,
    dropResultFromBox,
    isDropContentNull,
    cleanResultsInBox,
    deleteAllBoxes,
    cleanAllResults,
    getTitleByResult
  };
  return {
    ...computeds,
    ...functions
  };
});
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const boxesStore = useBoxesStore();
    const isEdit = !!route.query.edit;
    return (_ctx, _push, _parent, _attrs) => {
      const _component_frame_boxes = __nuxt_component_0;
      const _component_frame_results = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "app" }, _attrs))} data-v-2e6f24c4>`);
      _push(ssrRenderComponent(_component_frame_boxes, {
        "is-edit": isEdit,
        modelValue: unref(boxesStore),
        "onUpdate:modelValue": ($event) => isRef(boxesStore) ? boxesStore.value = $event : null
      }, null, _parent));
      _push(ssrRenderComponent(_component_frame_results, {
        "is-edit": isEdit,
        modelValue: unref(boxesStore),
        "onUpdate:modelValue": ($event) => isRef(boxesStore) ? boxesStore.value = $event : null
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("app/index.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const AppComponent = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-2e6f24c4"]]);
const _sfc_main$1 = {
  __name: "nuxt-error-page",
  __ssrInlineRender: true,
  props: {
    error: Object
  },
  setup(__props) {
    const props = __props;
    const _error = props.error;
    (_error.stack || "").split("\n").splice(1).map((line) => {
      const text = line.replace("webpack:/", "").replace(".vue", ".js").trim();
      return {
        text,
        internal: line.includes("node_modules") && !line.includes(".cache") || line.includes("internal") || line.includes("new Promise")
      };
    }).map((i) => `<span class="stack${i.internal ? " internal" : ""}">${i.text}</span>`).join("\n");
    const statusCode = Number(_error.statusCode || 500);
    const is404 = statusCode === 404;
    const statusMessage = _error.statusMessage ?? (is404 ? "Page Not Found" : "Internal Server Error");
    const description = _error.message || _error.toString();
    const stack = void 0;
    const _Error404 = defineAsyncComponent(() => import('./_nuxt/error-404-DUj0BMFv.mjs').then((r) => r.default || r));
    const _Error = defineAsyncComponent(() => import('./_nuxt/error-500-Qgkh2QBr.mjs').then((r) => r.default || r));
    const ErrorTemplate = is404 ? _Error404 : _Error;
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(unref(ErrorTemplate), mergeProps({ statusCode: unref(statusCode), statusMessage: unref(statusMessage), description: unref(description), stack: unref(stack) }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt/dist/app/components/nuxt-error-page.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const ErrorComponent = _sfc_main$1;
const _sfc_main = {
  __name: "nuxt-root",
  __ssrInlineRender: true,
  setup(__props) {
    const IslandRenderer = defineAsyncComponent(() => import('./_nuxt/island-renderer-CP1pX_SZ.mjs').then((r) => r.default || r));
    const nuxtApp = /* @__PURE__ */ useNuxtApp();
    nuxtApp.deferHydration();
    nuxtApp.ssrContext.url;
    const SingleRenderer = false;
    provide(PageRouteSymbol, useRoute());
    nuxtApp.hooks.callHookWith((hooks) => hooks.map((hook) => hook()), "vue:setup");
    const error = useError();
    onErrorCaptured((err, target, info) => {
      nuxtApp.hooks.callHook("vue:error", err, target, info).catch((hookError) => console.error("[nuxt] Error in `vue:error` hook", hookError));
      {
        const p = nuxtApp.runWithContext(() => showError(err));
        onServerPrefetch(() => p);
        return false;
      }
    });
    const islandContext = nuxtApp.ssrContext.islandContext;
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderSuspense(_push, {
        default: () => {
          if (unref(error)) {
            _push(ssrRenderComponent(unref(ErrorComponent), { error: unref(error) }, null, _parent));
          } else if (unref(islandContext)) {
            _push(ssrRenderComponent(unref(IslandRenderer), { context: unref(islandContext) }, null, _parent));
          } else if (unref(SingleRenderer)) {
            ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(SingleRenderer)), null, null), _parent);
          } else {
            _push(ssrRenderComponent(unref(AppComponent), null, null, _parent));
          }
        },
        _: 1
      });
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt/dist/app/components/nuxt-root.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const RootComponent = _sfc_main;
let entry;
{
  entry = async function createNuxtAppServer(ssrContext) {
    const vueApp = createApp(RootComponent);
    const nuxt = createNuxtApp({ vueApp, ssrContext });
    try {
      await applyPlugins(nuxt, plugins);
      await nuxt.hooks.callHook("app:created", vueApp);
    } catch (error) {
      await nuxt.hooks.callHook("app:error", error);
      nuxt.payload.error = nuxt.payload.error || createError(error);
    }
    if (ssrContext == null ? void 0 : ssrContext._renderResponse) {
      throw new Error("skipping render");
    }
    return vueApp;
  };
}
const entry$1 = (ssrContext) => entry(ssrContext);

export { _export_sfc as _, useRuntimeConfig as a, createError as c, entry$1 as default, injectHead as i, navigateTo as n, resolveUnrefHeadInput as r, useRouter as u };
//# sourceMappingURL=server.mjs.map
