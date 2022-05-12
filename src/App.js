import React from 'react';
import './App.css';
import { createPlugins, Plate, withProps } from "@udecode/plate-core"
import { createParagraphPlugin } from "@udecode/plate-paragraph"
import { createBlockquotePlugin } from "@udecode/plate-block-quote"
import {
  createBoldPlugin, 
  createItalicPlugin, 
  createUnderlinePlugin,
  createStrikethroughPlugin,
} from "@udecode/plate-basic-marks"
import {
  createHeadingPlugin
} from "@udecode/plate-heading"

import { createPlateUI, StyledElement } from "@udecode/plate-ui"
import { createComboboxPlugin } from '@udecode/plate-combobox';
import { createMentionPlugin, ELEMENT_MENTION } from '@udecode/plate-mention';
import { createLinkPlugin } from '@udecode/plate-link';
import { css } from 'styled-components';
import { MentionElement } from '@udecode/plate-ui-mention';
import { createMaggregatorPlugin, ELEMENT_MENTION_AGGREGATOR } from './components/MentionAggregator';
import MentionRemoteComboBox, { createMentionRemotePlugin } from './components/MentionRemoteComboBox';

function App() {

  const plugins = createPlugins([
    createParagraphPlugin(),
    createHeadingPlugin(),
    createBlockquotePlugin(),

    createBoldPlugin(),
    createItalicPlugin(),
    createUnderlinePlugin(),
    createStrikethroughPlugin(),
    createLinkPlugin(),

    // ORDER MATTERS FOR KEYDOWN INPUT, Maggregator AND MentionRemote MUST GO BEFORE ComboBox AND Mention
    createMaggregatorPlugin(),
    createMentionRemotePlugin(),
    
    createComboboxPlugin(),
    createMentionPlugin({
      options: {
        createMentionNode: item => ({
          value: item.text,
          id: item.key
        }),
        insertSpaceAfterMention: true
      }
    })
  ], {
    // Plate components
    components: { 
      ...createPlateUI(),
      [ELEMENT_MENTION_AGGREGATOR]: withProps(StyledElement, {
        as: 'div',
        styles: {
          root: css(["border: 1px solid black"])
        }
      }),
      [ELEMENT_MENTION]: withProps(MentionElement, {
        prefix: '@'
      })
    }
  })

  return (
    <div className="border-solid border-2 border-sky-500 h-screen padding p-8">
      <Plate plugins={plugins}>
        <MentionRemoteComboBox />
      </Plate>
    </div>
  );
}

export default App;
