import isEmpty from 'lodash/isEmpty'
import cloneDeep from 'lodash/cloneDeep'
/**
 * 将数组变换为指定格式输出
 * @param {*} dataList 数组
 * @param {*} parentName 上级名称
 */
export function transformTreeData(dataList = [], parentName, type = 2) {
    dataList.forEach(department => {
        department.id = department.departmentId
        department.name = department.departmentName
        department.type = type
        department.checked = false
        // department.origin = cloneDeep(department)
        department.path = `${parentName}`
        if (!isEmpty(department.users)) {
            department.users = department.users.map(user => {
                return {
                    id: user.id,
                    name: user.name,
                    type: 4,
                    checked: false,
                    children: [],
                    path: `${parentName}-${department.departmentName}`,
                    departmentId: department.departmentId,
                    departmentCode: department.departmentCode,
                    departmentName: department.departmentName,
                    // avatar: user.avatar,
                    // origin: user,
                }
            })
        }
        if (!isEmpty(department.children)) {
            transformTreeData(department.children, `${parentName}-${department.departmentName}`)
        }
    })
}


/**
 * 通过关键字搜索人名
 * @param {*} word 
 * @param {*} node 
 * @param {*} list 
 */
export function getNodeByKeyWord(word, node, list) {
    if (node.name.includes(word)) {
        list.push(node);
    }
    if (!isEmpty(node.users)) {
        node.users.forEach(user => {
            if (user.name.includes(word)) {
                list.push(user);
            }
        })
    }
    if (!isEmpty(node.children)) {
        for (let child of node.children) {
            list.concat(getNodeByKeyWord(word, child, list));
        }
    }
}

/**
 * 通过id获取node节点
 * @param {*} id 
 * @param {*} node 
 */
export function getNodeById(id, node, type = 2) {
    let result = null;
    if (node.id === id) {
        result = node;
    }
    else {
        if (!isEmpty(node.users) && type === 4) {
            for (let child of node.users) {
                let newResult = getNodeById(id, child);
                if (newResult) {
                    result = newResult;
                    break;
                }
            }
        }
        for (let child of node.children) {
            let newResult = getNodeById(id, child, type);
            if (newResult) {
                result = newResult;
                break;
            }
        }
    }
    return result;
}

/**
 * 通过类型获取node节点
 * @param {*} type 
 * @param {*} node 
 * @param {*} list 
 */
export function getNodeByType(type, node, list) {
    if (node.checked && type == node.type) {
        list.push(node);
    }
    else {
        if (!isEmpty(node.users) && type === 4) {
            for (let child of node.users) {
                list.concat(getNodeByType(type, child, list));
            }
        }
        for (let child of node.children) {
            list.concat(getNodeByType(type, child, list));
        }
    }
}

/**
 * 设置节点及子节点不被选中
 * @param {*} type 
 * @param {*} node 
 */
export function setNodeUnCheck(type, node) {
    node.checked = false;
    if (type == 4 && !isEmpty(node.users)) {
        for (let user of node.users) {
            user.checked = false
        }
    }
    for (let child of node.children) {
        setNodeUnCheck(type, child)
    }
}