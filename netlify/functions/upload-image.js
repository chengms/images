const fetch = require('node-fetch')

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    const { GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH = 'main' } = process.env
    
    const body = JSON.parse(event.body)
    const { filename, content } = body // content 需为 base64 编码

    const githubResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${filename}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Upload ${filename}`,
          content: content,
          branch: GITHUB_BRANCH,
        }),
      }
    )

    const result = await githubResponse.json()
    
    if (!githubResponse.ok) {
      throw new Error(result.message || 'GitHub upload failed')
    }

    // 转换为 jsDelivr 链接
    const jsDelivrUrl = result.content.download_url
      .replace('https://raw.githubusercontent.com', 'https://cdn.jsdelivr.net/gh')
      .replace(`/${GITHUB_BRANCH}/`, `@${GITHUB_BRANCH}/`)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: jsDelivrUrl }),
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    }
  }
}
