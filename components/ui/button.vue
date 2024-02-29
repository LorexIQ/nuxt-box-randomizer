<script setup lang="ts">
import type {ButtonStyle, ButtonType} from "./types";
import type {IconsType} from "~/app/icons";

interface Props {
  type?: ButtonType
  icon?: IconsType;
  decor?: ButtonStyle,
  disabled?: boolean
}

defineProps<Props>();
</script>

<template>
  <button
      class="ui-button"
      :class="{[`--${decor}`]: decor, 'disabled': disabled}"
      :type="type ?? 'button'"
  >
    <ui-icon
        v-if="icon"
        :icon="icon"
        size="16px"
    />
    <slot/>
  </button>
</template>

<style lang="scss" scoped>
.ui-button {
  font-size: 14px;
  line-height: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
  width: max-content;
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid #dfdfdf;
  color: #000;
  background: #fff;
  cursor: pointer;
  user-select: none;
  transition: .3s;

  &:hover {
    opacity: .8;
  }
  &.disabled {
    pointer-events: none !important;
    user-select: none;
    opacity: .5;
  }
  &__link {
    margin-left: 5px;
  }

  &.--green {
    border: 0;
    background: #41d15e;
    color: #fff;
  }
  &.--red {
    border: 0;
    background: #e75656;
    color: #fff;
  }
}
</style>
