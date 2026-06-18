export type NodeKind = 'person' | 'company' | 'target'

/** 相对主节点的方位：up=投资方（上方），down=被投资方（下方） */
export type NodePosition = 'up' | 'down'

export interface InvestTreeNodeData {
  name: string
  /** up=主节点上方，down=主节点下方 */
  position?: NodePosition
  kind?: NodeKind
  percent?: string
  /** 是否还有未加载的子节点（懒加载标记） */
  hasChildren?: boolean
}

export interface InvestTreeChild {
  id: string
  data: InvestTreeNodeData
  children?: InvestTreeChild[]
}

/** 主节点为第一层根节点，children 通过 data.position 区分上下 */
export interface InvestTreeData {
  id: string
  data: {
    name: string
    kind: 'target'
  }
  children: InvestTreeChild[]
}

/** 完整树（模拟后端数据源） */
const investTreeFullData: InvestTreeData = {
  id: 'root',
  data: { name: '某科技公司', kind: 'target' },
  children: [
    {
      id: 'up-l1-main',
      data: { name: '曜石海峡创业投资', position: 'up', kind: 'company', percent: '38%' },
      children: [
        {
          id: 'up-l2-main',
          data: { name: '北辰国有资产运营集团', position: 'up', kind: 'company', percent: '62%' },
          children: [
            {
              id: 'up-l3-main',
              data: { name: '北辰区财政保障中心', position: 'up', kind: 'company', percent: '100%' },
              children: [
                {
                  id: 'up-l4-main',
                  data: { name: '天津市北辰区人民政府', position: 'up', kind: 'company' },
                },
              ],
            },
            {
              id: 'up-l3-b',
              data: { name: '海河产业引导基金', position: 'up', kind: 'company', percent: '28%' },
            },
          ],
        },
      ],
    },
    {
      id: 'down-l1-c',
      data: { name: '彼岸合成生物', position: 'down', kind: 'company', percent: '100%' },
      children: [
        {
          id: 'down-l2-d',
          data: { name: '蓝藻菌种工程实验室', position: 'down', kind: 'company', percent: '80%' },
          children: [
            {
              id: 'down-l3-d',
              data: { name: '微藻规模化培养基地', position: 'down', kind: 'company', percent: '51%' },
              children: [
                {
                  id: 'down-l4-d',
                  data: { name: '滨海生物制造示范园', position: 'down', kind: 'company', percent: '100%' },
                },
              ],
            },
          ],
        },
        {
          id: 'down-l2-e',
          data: { name: '发酵工艺研发中心', position: 'down', kind: 'company', percent: '65%' },
          children: [
            {
              id: 'down-l3-e',
              data: { name: '菌种代谢工程平台', position: 'down', kind: 'company', percent: '40%' },
            },
          ],
        },
      ],
    },
    {
      id: 'down-l1-b',
      data: { name: '极光半导体装备', position: 'down', kind: 'company', percent: '60%' },
      children: [
        {
          id: 'down-l2-c',
          data: { name: '晶纬高纯材料', position: 'down', kind: 'company', percent: '45%' },
          children: [
            {
              id: 'down-l3-c',
              data: { name: '硅烷纯化装置事业部', position: 'down', kind: 'company', percent: '88%' },
              children: [
                {
                  id: 'down-l4-c',
                  data: { name: '张维', position: 'down', kind: 'person', percent: '12%' },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'down-l1-a',
      data: { name: '潮汐人工智能', position: 'down', kind: 'company', percent: '100%' },
      children: [
        {
          id: 'down-l2-a',
          data: { name: '棱镜视觉算法研究院', position: 'down', kind: 'company', percent: '72%' },
          children: [
            {
              id: 'down-l3-a',
              data: { name: '多模态感知实验室', position: 'down', kind: 'company', percent: '55%' },
              children: [
                {
                  id: 'down-l4-a',
                  data: { name: '陈明', position: 'down', kind: 'person', percent: '18%' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

function findTreeNode(nodeId: string): InvestTreeData | InvestTreeChild | null {
  if (nodeId === investTreeFullData.id) return investTreeFullData

  const stack: InvestTreeChild[] = [...investTreeFullData.children]
  while (stack.length > 0) {
    const node = stack.pop()!
    if (node.id === nodeId) return node
    if (node.children) stack.push(...node.children)
  }
  return null
}

function toLazyChild(child: InvestTreeChild): InvestTreeChild {
  return {
    id: child.id,
    data: {
      ...child.data,
      hasChildren: !!(child.children?.length),
    },
  }
}

/** 初始图：根节点 + 上下各一层，不含更深层级 */
export const investTreeInitialData: InvestTreeData = {
  id: investTreeFullData.id,
  data: investTreeFullData.data,
  children: investTreeFullData.children.map(toLazyChild),
}

const FETCH_DELAY_MS = 200

/** 模拟异步接口：按 parentId 拉取下一层子节点 */
export async function fetchInvestChildren(parentId: string): Promise<InvestTreeChild[]> {
  await new Promise((resolve) => setTimeout(resolve, FETCH_DELAY_MS))
  const parent = findTreeNode(parentId)
  if (!parent?.children?.length) return []
  return parent.children.map(toLazyChild)
}
