export interface AtOrTag {
  name: string;
  type: string;
  id: number;
}

export function joinAts(originContent: string, ats: AtOrTag[]) {
  return originContent +' '+ ats.map(at => `@[${at.name}](/${at.type}/${at.id})`).join(' ')
}

export function joinTags(originContent: string, tags: AtOrTag[]) {
  return originContent +' '+ tags.map(tag => `#[${tag.name}](/${tag.type}/${tag.id})`).join(' ')
}


/**
 * 获取文本内容
 * @param content 
 */
export function getShowContent(content: string) {
  const REGEX = /([@#]\[[\S]+\]\(\/[a-zA-Z0-9_-]+\/\d+\))/g
  const ITEM_REGEX = /^([@#])\[([\S]+)\]\((\/[a-zA-Z0-9_-]+\/\d+)\)/

  let showFragments: string[] = [];
  let fullFragments: string[] = [];

  if (content) {
    fullFragments = content.split(REGEX)

    for(let i=0;i<fullFragments.length;i++){
      let item = fullFragments[i];
      const matched = item.match(ITEM_REGEX)
      if (matched) {
        showFragments.push(matched[1] + matched[2])
      } else {
        showFragments.push(item)
      }
    }
  }
  return showFragments.join('')
}
