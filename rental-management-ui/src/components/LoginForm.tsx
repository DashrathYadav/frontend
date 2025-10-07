import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "./Button";
import { Input } from "./Input";
import { Label } from "./Label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./Card";
import { useAuth } from "../contexts/AuthContext";
import { USER_ROLES, type UserRole } from "../constants";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "./Select";

export function LoginForm() {
    const { t } = useTranslation();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { login, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Get the intended destination from location state, or default to dashboard
    const from = (location.state as any)?.from?.pathname || "/dashboard";

    // Form validation schema with translations
    const loginSchema = useMemo(() => z.object({
        loginId: z.string().min(1, t('validation.loginIdRequired')),
        password: z.string().min(1, t('validation.passwordRequired')),
        role: z.enum([USER_ROLES.ADMIN, USER_ROLES.OWNER, USER_ROLES.TENANT], {
            errorMap: () => ({ message: t('validation.roleRequired') })
        }),
    }), [t]);

    type LoginFormData = z.infer<typeof loginSchema>;

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });
    const selectedRole = watch("role");

    const onFormSubmit = async (data: LoginFormData) => {
        setError(null);

        try {
            const success = await login(data.loginId, data.password, data.role);

            if (success) {
                // Redirect to the intended page or dashboard
                navigate(from, { replace: true });
            } else {
                setError(t('auth.loginFailed'));
            }
        } catch (err) {
            setError(t('auth.loginError'));
        }
    };

    return (
        <Card className="w-full">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center">{t('auth.loginTitle')}</CardTitle>
                <CardDescription className="text-center">
                    {t('auth.loginDescription')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="role">{t('auth.role')}</Label>
                        <Select
                            onValueChange={(value: UserRole) => setValue("role", value, { shouldValidate: true })}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={t('auth.selectRole')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>{t('auth.roleLabel')}</SelectLabel>
                                    <SelectItem value={USER_ROLES.ADMIN}>{t('auth.admin')}</SelectItem>
                                    <SelectItem value={USER_ROLES.OWNER}>{t('auth.owner')}</SelectItem>
                                    <SelectItem value={USER_ROLES.TENANT}>{t('auth.tenant')}</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        {errors.role && (
                            <p className="text-sm text-red-500">{errors.role.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="loginId">{t('auth.loginId')}</Label>
                        <Input
                            id="loginId"
                            type="text"
                            placeholder={t('auth.loginIdPlaceholder')}
                            {...register("loginId")}
                            className={errors.loginId ? "border-red-500" : ""}
                        />
                        {errors.loginId && (
                            <p className="text-sm text-red-500">{errors.loginId.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">{t('auth.password')}</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder={t('auth.passwordPlaceholder')}
                                {...register("password")}
                                className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-sm text-red-500">{errors.password.message}</p>
                        )}
                    </div>

                    {error && (
                        <div className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading || !selectedRole}>
                        {loading ? t('auth.loggingIn') : t('auth.loginButton')}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
                <div className="text-sm text-center text-gray-600">
                    {t('auth.dontHaveAccount')}{" "}
                    <Link to="/register" className="text-primary hover:underline">
                        {t('auth.signupLink')}
                    </Link>
                </div>
            </CardFooter>
        </Card>
    );
} 