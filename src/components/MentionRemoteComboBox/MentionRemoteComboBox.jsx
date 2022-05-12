import { comboboxSelectors, comboboxStore } from "@udecode/plate-combobox";
import { useEventEditorId } from "@udecode/plate-core";
import { createPluginFactory, findNode, getPluginType, usePlateEditorRef } from "@udecode/plate-core";
import { getPluginOptions } from "@udecode/plate-core";
import { ELEMENT_MENTION, ELEMENT_MENTION_INPUT, getMentionOnSelectItem } from "@udecode/plate-mention";
import { MentionCombobox } from "@udecode/plate-ui-mention";
import { useMemo, useRef } from "react";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid"

export const KEY_MENTION_REMOTE = "mentionremote"

class ModState {

    #enabled = false;

    isEnabled = () => this.#enabled

    enable = () => this.#enabled = true

    disable = () => this.#enabled = false
}

const mentions = {}

const addMention = (trigger, mentionName) => {

    if (!mentions[trigger]) {
        mentions[trigger] = []
    }

    const id = uuidv4()

    mentions[trigger].push({ key: id, text: mentionName })

    return Promise.resolve(id)
}

const getRemoteMentions = (trigger, text) => {
    console.log(`Get mentions ${JSON.stringify(mentions[trigger])}`)
    return Promise.resolve(mentions[trigger])
}

const hotKey = new ModState()

const hotkeyKeyUp = editor => event => {

    if (event.key === 'Meta' || event.key === 'Control') {
        console.log("Hotkey disabled")
        hotKey.disable()
    }
}

const mentionCreateKeyDown = editor => event => {

    if (event.key === 'Tab' || event.key === 'Enter') {
        const currentMentionInput = findMentionInput(editor)
        console.log(`${JSON.stringify(currentMentionInput)}`)
        
        if (currentMentionInput) {
            event.preventDefault()
            const highlightedText = comboboxSelectors.filteredItems()[comboboxSelectors.highlightedIndex()]?.text.toLowerCase()
            const inputText = comboboxSelectors.text()

            // Let people create new mentions even if the short text would match a selection
            if (inputText && (!highlightedText || (inputText.toLowerCase() !== highlightedText && hotKey.isEnabled()))) {
                const trigger = comboboxSelectors.byId()[comboboxSelectors.activeId()].get.trigger()
                return onMentionCreateTrigger(editor, trigger, inputText)
            }
        }
    } else if (event.key === 'Meta' || event.key === 'Control') {
        console.log("Hotkey enabled")
        hotKey.enable()
    }
};

const findMentionInput = (editor, options) => findNode(editor, { ...options,
  match: {
    type: getPluginType(editor, ELEMENT_MENTION_INPUT)
  }
});

const onMentionCreateTrigger = (editor, trigger, inputText) => {
    addMention(trigger, inputText).then((id) => {
        getMentionOnSelectItem()(editor, { text: inputText, key: id })
    })
    return true
}

const MentionRemoteComboBox = ({pluginKey = ELEMENT_MENTION, id = pluginKey}) => {
    const [mentions, setMentions] = useState([])
    const search = useRef()
    const open = comboboxStore.use.isOpen()
    const text = comboboxStore.use.text()
    const activeId = comboboxStore.use.activeId()
    const focusEditorId = useEventEditorId()
    const editor = usePlateEditorRef()
    
    const { trigger } = getPluginOptions(
        editor,
        pluginKey
    );
    
    const isOpen = useMemo(() => {
        return open && focusEditorId === editor.id && activeId === id
    }, [open, focusEditorId, editor, activeId, id])

    useEffect(() => {

        if (text === null) {
            search.current = text
        } else if (isOpen && text !== search.current) {
            search.current = text
            getRemoteMentions(trigger, text).then(mentions => setMentions(mentions))
        }
    }, [text, isOpen, search, trigger])

    return <MentionCombobox id={id} pluginKey={pluginKey} items={mentions} trigger={trigger} />
}

export const createMentionRemotePlugin = createPluginFactory({
    key: KEY_MENTION_REMOTE,
    isElement: false,
    handlers: {
        onKeyDown: mentionCreateKeyDown,
        onKeyUp: hotkeyKeyUp
    }
})

export default MentionRemoteComboBox;
