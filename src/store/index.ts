import { Plugin } from '@nuxt/types'
import { AxiosInstance } from 'axios'
import { Asset } from 'mixin-node-sdk'
import Vue from 'vue'
import Vuex, { ActionTree, MutationTree } from 'vuex'

import { AuthInfo, MixinResponse, Project, RootState } from '@/types'

Vue.use(Vuex)

const state = (): RootState => ({
  allAssets: [],
  assets: [],
  allUserAssets: [],
  userAssets: [],
  envs: {},
  loading: false,
  projects: {},
})

const ASSETS = ['BTC', 'BCH', 'ETH', 'EOS', 'XRP', 'XMR']

const filterAssets = (assets: Asset[]) =>
  assets.reduce<Asset[]>((acc, asset) => {
    const index = ASSETS.indexOf(asset.symbol)
    if (index !== -1) {
      acc[index] = asset
    }
    return acc
  }, [])

const actions: ActionTree<RootState, RootState> = {
  async fetchAuthInfo({ commit, rootState }) {
    if (rootState.user) {
      return
    }
    const { data } = await rootState.http.get<AuthInfo>('/authInfo')
    commit('SET_AUTH_INFO', data)
  },
  async getProject({ commit, rootState }, projectName) {
    const originalProject = rootState.projects[projectName]
    if (originalProject) {
      return originalProject
    }
    const { data } = await rootState.http.get<Project>(
      `/projects/${projectName}`,
    )
    commit('SET_PROJECT', data)
    return data
  },
  async getAssets({ commit, rootState }) {
    if (rootState.assets.length > 0) {
      return
    }
    const { data } = await rootState.http.get<Asset[]>('/mixin/assets')
    commit('SET_ALL_ASSETS', data)
  },
  async getUserAssets({ commit, rootState }) {
    if (rootState.userAssets.length > 0 || !rootState.mixinAuth) {
      return
    }
    const {
      data: { data, error },
    } = await rootState.http.get<MixinResponse<Asset[]>>('/assets')
    if (error) {
      return
    }
    commit('SET_ALL_USER_ASSETS', data)
  },
}

const mutations: MutationTree<RootState> = {
  SET_HTTP(state, http: AxiosInstance) {
    state.http = http
  },
  SET_AUTH_INFO(state, authInfo: AuthInfo) {
    Object.assign(state, authInfo)
  },
  SET_LOADING(state, loading: boolean) {
    state.loading = loading
  },
  SET_PROJECT(state, project: Project) {
    state.projects[project.name] = project
  },
  SET_PROJECTS(state, projects: Project[] | Record<string, Project>) {
    if (!Array.isArray(projects)) {
      Object.assign(state.projects, projects)
      return
    }

    projects.forEach(project =>
      Object.assign(state.projects, {
        [project.name]: project,
      }),
    )
  },
  SET_ALL_ASSETS(state, allAssets: Asset[]) {
    state.allAssets = allAssets
    state.assets = filterAssets(allAssets)
  },
  SET_ALL_USER_ASSETS(state, allUserAssets: Asset[]) {
    state.allUserAssets = allUserAssets
    state.userAssets = filterAssets(allUserAssets)
  },
}

const store = new Vuex.Store({
  state,
  actions,
  mutations,
})

const storePlugin: Plugin = ({ app }) => {
  app.store = store
}

export default storePlugin
