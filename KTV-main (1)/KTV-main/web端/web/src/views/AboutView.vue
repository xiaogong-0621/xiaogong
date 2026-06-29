<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="about-page min-h-screen bg-white dark:bg-[var(--d-bg)] transition-colors duration-300">
    <!-- Top bar -->
    <div class="relative z-10 max-w-3xl mx-auto px-5 flex items-center gap-3 py-4">
      <button
        @click="router.back()"
        class="w-10 h-10 rounded-xl bg-surface-container-lowest/70 backdrop-blur-lg border border-outline-variant/10 shadow-ambient-sm flex items-center justify-center hover:bg-surface-container hover:scale-105 transition-all"
      >
        <span class="material-symbols-outlined text-lg text-on-surface">arrow_back</span>
      </button>
      <span class="text-lg font-bold text-on-surface font-headline">关于声域友</span>
    </div>

    <div class="relative z-10 max-w-3xl mx-auto px-5 pb-20">
      <!-- Hero -->
      <div class="text-center py-10">
        <div class="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
          <span class="material-symbols-outlined text-4xl text-white">mic</span>
        </div>
        <h1 class="text-3xl font-extrabold text-on-surface tracking-tight">声域友</h1>
        <p class="text-on-surface-variant mt-1">线上社交 KTV 点歌平台</p>
        <div class="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <span class="material-symbols-outlined text-sm">verified</span>
          v1.0.0
        </div>
      </div>

      <!-- Quick Start -->
      <Section title="快速开始" icon="rocket_launch">
        <Step num="1" title="注册账号">
          打开登录页，支持<span class="font-semibold">用户名</span>、<span class="font-semibold">手机号</span>、<span class="font-semibold">邮箱</span>三种注册方式，填写昵称即可完成。
        </Step>
        <Step num="2" title="加入房间">
          登录后输入 <span class="font-semibold font-mono text-primary">6 位房间码</span> 加入已有房间，或提交开房申请等待审批。
        </Step>
        <Step num="3" title="点歌开唱">
          在「探索歌曲」页面浏览曲库，点击<span class="font-semibold">点歌按钮</span>将歌曲加入播放队列，即可与好友一起欢唱。
        </Step>
      </Section>

      <!-- Features -->
      <Section title="核心功能" icon="auto_awesome">
        <Feature icon="explore" title="探索歌曲" desc="浏览曲库、按流派筛选、搜索歌曲、一键收藏和点歌。" />
        <Feature icon="meeting_room" title="虚拟房间" desc="创建或加入房间，与朋友实时共享播放队列，房间内实时聊天互动。" />
        <Feature icon="equalizer" title="播放器" desc="悬浮胶囊播放器，切页面不中断。全屏歌词页支持漏斗式滚动歌词、播放模式切换。" />
        <Feature icon="format_list_bulleted" title="播放队列" desc="拖拽排序、自动轮播，仅点歌人可控制切歌和播放模式。" />
        <Feature icon="trending_up" title="热门榜单" desc="日榜 / 周榜实时排行，快速发现大家都在唱什么。" />
        <Feature icon="favorite" title="我的收藏" desc="一键收藏喜欢的歌曲，随时从收藏列表快速点歌。" />
      </Section>

      <!-- Player Guide -->
      <Section title="播放器指南" icon="play_circle">
        <div class="space-y-4">
          <GuideItem>
            <template #title>胶囊播放器</template>
            底部固定悬浮条，显示封面、歌名、进度条和播放控制。点击封面可打开全屏歌词页。
          </GuideItem>
          <GuideItem>
            <template #title>全屏歌词页</template>
            左侧大封面 + 进度控制，右侧漏斗式歌词（当前行高亮，远处渐隐）。点击歌词可跳转到对应时间。
          </GuideItem>
          <GuideItem>
            <template #title>播放模式</template>
            <div class="flex flex-wrap gap-2 mt-1">
              <ModeTag icon="repeat" label="顺序播放" />
              <ModeTag icon="repeat_on" label="列表循环" />
              <ModeTag icon="repeat_one" label="单曲循环" />
              <ModeTag icon="shuffle" label="随机播放" />
            </div>
          </GuideItem>
        </div>
      </Section>

      <!-- Rules -->
      <Section title="房间规则" icon="gavel">
        <Rule text="一个用户同时只能在一个房间，加入新房间自动退出旧房间。" />
        <Rule text="同一首歌在同一个房间只能被点一次。" />
        <Rule text="仅当前歌曲的点歌人可控制播放、暂停、切歌和模式切换。" />
        <Rule text="退出房间后，你点播的歌曲会从队列中移除。" />
        <Rule text="聊天消息最长 200 字，每 2 秒自动刷新。" />
      </Section>

      <!-- Tech Stack -->
      <Section title="技术栈" icon="code">
        <div class="grid grid-cols-2 gap-3">
          <TechItem icon="language" label="前端" value="Vue 3 + TypeScript + Tailwind CSS" />
          <TechItem icon="dns" label="后端" value="ASP.NET Core 8.0 + Dapper" />
          <TechItem icon="storage" label="数据库" value="SQL Server" />
          <TechItem icon="sync" label="实时同步" value="REST 轮询（2 秒）" />
        </div>
      </Section>

      <!-- Footer -->
      <div class="text-center py-10 text-xs text-on-surface-variant/50">
        <p>声域友 &copy; 2026 · 线上社交 KTV 点歌平台</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, h } from 'vue'

const Section = defineComponent({
  props: ['title', 'icon'],
  setup(props, { slots }) {
    return () => h('div', { class: 'mb-8' }, [
      h('div', { class: 'flex items-center gap-2 mb-4' }, [
        h('span', { class: 'material-symbols-outlined text-xl text-primary' }, props.icon),
        h('h2', { class: 'text-lg font-bold text-on-surface' }, props.title),
      ]),
      h('div', { class: 'bg-surface-container-low/50 rounded-2xl p-5 border border-outline-variant/10' }, slots.default?.()),
    ])
  },
})

const Step = defineComponent({
  props: ['num', 'title'],
  setup(props, { slots }) {
    return () => h('div', { class: 'flex gap-4 mb-4 last:mb-0' }, [
      h('div', { class: 'w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5' }, props.num),
      h('div', null, [
        h('div', { class: 'font-semibold text-on-surface mb-0.5' }, props.title),
        h('div', { class: 'text-sm text-on-surface-variant leading-relaxed' }, slots.default?.()),
      ]),
    ])
  },
})

const Feature = defineComponent({
  props: ['icon', 'title', 'desc'],
  setup(props) {
    return () => h('div', { class: 'flex gap-3 mb-3 last:mb-0' }, [
      h('div', { class: 'w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0' }, [
        h('span', { class: 'material-symbols-outlined text-lg text-primary' }, props.icon),
      ]),
      h('div', null, [
        h('div', { class: 'font-semibold text-on-surface text-sm' }, props.title),
        h('div', { class: 'text-xs text-on-surface-variant leading-relaxed mt-0.5' }, props.desc),
      ]),
    ])
  },
})

const GuideItem = defineComponent({
  setup(_, { slots }) {
    return () => h('div', { class: 'pl-4 border-l-2 border-primary/20' }, [
      h('div', { class: 'font-semibold text-on-surface text-sm mb-1' }, slots.title?.()),
      h('div', { class: 'text-xs text-on-surface-variant leading-relaxed' }, slots.default?.()),
    ])
  },
})

const ModeTag = defineComponent({
  props: ['icon', 'label'],
  setup(props) {
    return () => h('span', { class: 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium' }, [
      h('span', { class: 'material-symbols-outlined text-sm' }, props.icon),
      props.label,
    ])
  },
})

const Rule = defineComponent({
  props: ['text'],
  setup(props) {
    return () => h('div', { class: 'flex gap-2 mb-2 last:mb-0' }, [
      h('span', { class: 'material-symbols-outlined text-sm text-primary mt-0.5 flex-shrink-0' }, 'check_circle'),
      h('span', { class: 'text-sm text-on-surface-variant leading-relaxed' }, props.text),
    ])
  },
})

const TechItem = defineComponent({
  props: ['icon', 'label', 'value'],
  setup(props) {
    return () => h('div', { class: 'bg-surface-container/50 rounded-xl p-3 border border-outline-variant/10' }, [
      h('div', { class: 'flex items-center gap-1.5 mb-1' }, [
        h('span', { class: 'material-symbols-outlined text-sm text-primary' }, props.icon),
        h('span', { class: 'text-xs font-semibold text-on-surface' }, props.label),
      ]),
      h('div', { class: 'text-xs text-on-surface-variant' }, props.value),
    ])
  },
})

export default {
  components: { Section, Step, Feature, GuideItem, ModeTag, Rule, TechItem },
}
</script>
