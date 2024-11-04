import { GithubOutlined } from '@ant-design/icons';
// 引入文件的icon
import { LinkOutlined } from '@ant-design/icons';
import { DefaultFooter } from '@ant-design/pro-components';
import '@umijs/max';
import React from 'react';

const Footer: React.FC = () => {
  const defaultMessage = 'IDT';
  const currentYear = new Date().getFullYear();
  return (
    <DefaultFooter
      style={{
        background: 'none',
      }}
      copyright={`${currentYear} ${defaultMessage}`}
      links={[
        {
          key: 'AMSNet',
          title: (
            <>
              <LinkOutlined /> AMSNet
            </>
          ),
          href: 'https://arxiv.org/abs/2405.09045',
        },
        {
          key: 'Ant Design',
          title: 'link2',
          href: 'https://codefather.cn',
          blankTarget: true,
        },
        {
          key: 'github',
          title: (
            <>
              <GithubOutlined /> ...
            </>
          ),
          href: 'https://github.com/liyupi',
          blankTarget: true,
        },
      ]}
    />
  );
};
export default Footer;
