import './globals.css';
import SessionWrapper from '@/components/providers/SessionWrapper.jsx';
import ApolloWrapper  from '@/components/providers/ApolloWrapper.jsx';

export const metadata = {
  title: 'Quản lý Thư viện',
  description: 'Hệ thống quản lý thư viện sách',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <SessionWrapper>
          <ApolloWrapper>
            {children}
          </ApolloWrapper>
        </SessionWrapper>
      </body>
    </html>
  );
}
