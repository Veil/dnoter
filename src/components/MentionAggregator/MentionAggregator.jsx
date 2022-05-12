import { createPluginFactory, getPluginType } from "@udecode/plate-core";
import { ELEMENT_MENTION } from "@udecode/plate-mention";
import { ELEMENT_PARAGRAPH } from "@udecode/plate-paragraph";
import { Editor, Element, Path, Transforms } from "slate";
import { v4 as uuidv4 } from "uuid"

export const ELEMENT_MENTION_AGGREGATOR = "maggregator"

const withAggregator = (editor) => {
    const {
      apply
    } = editor;

    editor.apply = operation => {
      apply(operation);

      if (operation.type === 'insert_node' && operation.node.type === getPluginType(editor, ELEMENT_MENTION)) {
          onNewMention(editor, operation)
      }

      if (operation.type === 'remove_node' && operation.node.type === getPluginType(editor, ELEMENT_MENTION)) {
          onMentionRemove(editor, operation)
      }
    }
    return editor
}

const onNewMention = (editor, operation) => {
    const aggrNode = Editor.above(editor, {
        at: editor.selection,
        match: (node) => node.type === getPluginType(editor, ELEMENT_MENTION_AGGREGATOR)
    })

    // If we already have an aggregator, we don't need to create another
    if (!aggrNode) {
        const [, paraPath] = Editor.above(editor, {
            at: editor.selection,
            match: (node) => node.type === getPluginType(editor, ELEMENT_PARAGRAPH)
        })

        // Defer this as otherwise we end up with pathing issues as the mention node is inputted
        Promise.resolve().then(() => {
            Transforms.wrapNodes(editor, {
            type: getPluginType(editor, ELEMENT_MENTION_AGGREGATOR),
            id: uuidv4()
            }, { at: editor.selection, match: (n, p) => Path.equals(paraPath, p) })
        })
    }
}

const onMentionRemove = (editor, operation) => {
    const aggrNode = Editor.above(editor, {
        at: editor.selection,
        match: (node) => node.type === getPluginType(editor, ELEMENT_MENTION_AGGREGATOR)
    })

    // Only do tree traversal if we're actually in an aggregated node
    if (aggrNode) {
    
        const otherMentions = Editor.nodes(editor, { 
            at: aggrNode[1], 
            match: (node) => node.type === getPluginType(editor, ELEMENT_MENTION),
            mode: "highest" 
        })

        let currentMention = otherMentions.next()

        // If we didn't find any, just unwrap
        if (currentMention.done) {
            Transforms.unwrapNodes(editor, { match: (node) => Element.isElement(node) && node.type === getPluginType(editor, ELEMENT_MENTION_AGGREGATOR) })
        }
    }
}

export const createMaggregatorPlugin = createPluginFactory({
  key: ELEMENT_MENTION_AGGREGATOR,
  isElement: true,
  withOverrides: withAggregator
})

export default createMaggregatorPlugin;

