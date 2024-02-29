<template>
  <div class="box-frame">
    <slot/>
  </div>
</template>

<style scoped lang="scss">
.box-frame {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 130px;
  height: 180px;
  background: #fbfbfb;
  border-radius: 10px;
  box-shadow: 0 0 10px #e5e4e4;
  cursor: pointer;
  overflow: hidden;
  transition: .3s;

  &:hover {
    box-shadow: 0 0 5px #e5e4e4;
    transform: scale(0.95);
  }
  &:active {
    box-shadow: 0 0 2px #e5e4e4;
    transform: scale(0.92);
  }
}
</style>
