<template>
  <label class="input-text"
    :class="{ 'input-text--focus': isFocused }">
    <input type="text" ref="input"
      :size="inputSize"
      :maxlength="maxlength"
      v-model="textValue"
      @keyup.enter="submit"
      @focus="focus"
      @blur="blur" />
  </label>
</template>

<style lang="scss">
.input-text {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  > input {
    position: absolute;
    top: -6px;
    left: -6px;
    display: inline-block;
    outline: none;

    background: rgba(#222, 0.25);
    border: 2px solid rgba(#000, 0.25);
    border-radius: 2px;
    padding: 2px 4px;
    width: auto;
    opacity: 0;

    color: inherit;
    font: inherit;
    text-align: inherit;
    text-indent: inherit;
    letter-spacing: inherit;
    word-spacing: inherit;

    &:focus {
      opacity: 1
    }
  }
}
</style>

<script>
export default {
  name: 'input-text',
  props: {
    value: String,
    maxlength: Number,
    maxsize: Number
  },

  data () {
    return {
      textValue: null,
      isFocused: false
    }
  },

  created () {
    this.textValue = this.value
  },

  methods: {
    focus () {
      this.isFocused = true
    },

    blur () {
      this.isFocused = false
    },

    submit () {
      this.$refs.input.blur()
    }
  },

  computed: {
    inputSize () {
      return Math.min(this.maxsize || 32,
        Math.round((this.textValue.length || 1) * 1.2 + 3))
    }
  },

  watch: {
    // OPTIM: Better way to respond to upstream prop change?
    value () {
      this.textValue = this.value
    },

    textValue () {
      const value = this.textValue.trim() || '-'
      this.$emit('input', value)
    }
  }
}
</script>
