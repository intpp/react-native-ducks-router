// @flow
import { NavigationExperimental } from 'react-native';
import shallowequal from 'shallowequal';

const { StateUtils } = NavigationExperimental;

const KEY = 'router';
const ROUTER_PUSH = `${KEY}/push`;
const ROUTER_POP = `${KEY}/pop`;
const ROUTER_RESET = `${KEY}/reset`;
const ROUTER_JUMP = `${KEY}/jump`;
const ROUTER_REMOVE = `${KEY}/remove`;

type Route = {
  key: string,
  params?: Object,
};

type State = {
  index: ?number,
  routes: Route[],
};

type Handler<T> = {
  [key: string]: (state: T, action: Action<*>) => T,
};

type Action<T> = {
  type: string,
  payload: T,
};

type ResetPayload = {
  routes: Route | Route[],
  index?: number,
};

function push(payload: Route) {
  return {
    type: ROUTER_PUSH,
    payload,
  };
}

function pop() {
  return {
    type: ROUTER_POP,
  };
}

function reset(payload: ResetPayload) {
  return {
    type: ROUTER_RESET,
    payload,
  };
}

function jump(payload: Route) {
  return {
    type: ROUTER_JUMP,
    payload,
  };
}

function remove(payload: Route) {
  return {
    type: ROUTER_REMOVE,
    payload,
  };
}

const getIndex = (state: State) => (route: Route) => state.routes.findIndex(stackRoute => stackRoute.key === route.key);

const initialState: State = {
  index: null,
  routes: [],
};

const actionHandlers: Handler<State> = {
  [ROUTER_PUSH]: (state, action: Action<Route>): State => {
    const newRoute = action.payload;
    if (state.routes.length === 0) {
      return StateUtils.push(state, newRoute);
    }

    const currentRoute = state.routes[state.index];
    const sameRoute = currentRoute.key === (newRoute && newRoute.key);
    const payloadDiffers = currentRoute.params
      && newRoute.params && !shallowequal(currentRoute.params, newRoute.params);

    if (sameRoute && !payloadDiffers) {
      return state;
    }

    return sameRoute && payloadDiffers
      ? StateUtils.replaceAt(state, newRoute.key, newRoute)
      : StateUtils.push(state, newRoute);
  },

  [ROUTER_POP]: (state): State => (state.index > 0 ? StateUtils.pop(state) : state),
  [ROUTER_RESET]: (state, action: Action<ResetPayload>): State => {
    const { routes, index } = action.payload;
    const newRoutes = Array.isArray(routes) ? routes : [routes];
    return StateUtils.reset(state, newRoutes, index);
  },
  [ROUTER_JUMP]: (state, action: Action<Route>): State => StateUtils.jumpTo(state, action.payload.key),
  [ROUTER_REMOVE]: (state, action: Action<Route>): State => {
    const index = state.routes.findIndex(route => route.key === action.payload.key);
    if (index === state.index) {
      throw new Error('Unable to remove current route, use \'pop\' instead');
    }

    if (index === -1) {
      return state;
    }

    const newRoutes = [
      ...state.routes.slice(0, index),
      ...state.routes.slice(index + 1),
    ];

    return {
      index: state.index - 1,
      routes: newRoutes,
    };
  },
};

const actionTypes = {
  ROUTER_PUSH,
  ROUTER_POP,
  ROUTER_RESET,
  ROUTER_JUMP,
  ROUTER_REMOVE,
};

const actionCreators = {
  push,
  pop,
  reset,
  jump,
  remove,
};

const selectors = {
  getIndex,
};

export {
  initialState,
  actionTypes,
  actionCreators,
  selectors,
};

export default (state: State = initialState, action: Action<*>): State => {
  const handler = actionHandlers[action.type];
  return handler ? handler(state, action) : state;
};
