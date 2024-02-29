<script setup lang="ts">
import type {UseSwitch} from "~/composables/useSwitch";

interface Props {
  modelValue: UseSwitch;
}

const props = defineProps<Props>();
const hook = props.modelValue;
</script>

<template>
  <transition name="fade">
    <div
        class="modal"
        v-if="hook.status.value"
    >
      <block-click-outside
          class="modal__content"
          @trigger="hook.hide"
          :state="hook.status.value"
      >
        <slot/>
      </block-click-outside>
    </div>
  </transition>
</template>

<style lang="scss" scoped>
.modal {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  padding: 10px;
  background-color: rgba(0, 0, 0, 0.3);
  overflow: hidden;

  &__content {
    display: flex;
    flex-direction: column;
    width: min(580px, 100%);
    max-height: 100%;
    min-height: 50px;
    height: min-content;
    max-height: 100%;
    border-radius: 7px;
    background-color: #fff;
    overflow: hidden;

    & > * {
      padding: 15px 20px;
    }
    & .l-hr {
      width: 100%;
      padding: 0;
    }
  }
}
</style>
