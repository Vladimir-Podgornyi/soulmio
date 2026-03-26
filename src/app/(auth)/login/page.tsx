import { LoginPage } from '@/views/login/LoginPage'

interface Props {
  searchParams: Promise<{ error?: string; error_code?: string }>
}

export default async function Login({ searchParams }: Props) {
  const params = await searchParams
  return <LoginPage errorCode={params.error_code} />
}
