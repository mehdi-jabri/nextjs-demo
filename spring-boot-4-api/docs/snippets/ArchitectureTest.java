// CANONICAL ArchUnit test enforcing hexagonal boundaries. Place under src/test/java.
package <<org>>.<<service_name>>;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;

@AnalyzeClasses(
    packages = "<<org>>.<<service_name>>",
    importOptions = { ImportOption.DoNotIncludeTests.class }
)
class ArchitectureTest {

    @ArchTest
    static final ArchRule layered =
        layeredArchitecture()
            .consideringAllDependencies()
            .layer("api").definedBy("..api..")
            .layer("application").definedBy("..application..")
            .layer("domain").definedBy("..domain..")
            .layer("infrastructure").definedBy("..infrastructure..")
            .layer("config").definedBy("..config..")

            .whereLayer("api").mayNotBeAccessedByAnyLayer()
            .whereLayer("application").mayOnlyBeAccessedByLayers("api", "config")
            .whereLayer("domain").mayOnlyBeAccessedByLayers("api", "application", "infrastructure", "config")
            .whereLayer("infrastructure").mayOnlyBeAccessedByLayers("config");

    @ArchTest
    static final ArchRule domainIsPure =
        noClasses().that().resideInAPackage("..domain..")
            .should().dependOnClassesThat().resideInAnyPackage(
                "org.springframework..",
                "jakarta.persistence..",
                "org.hibernate..",
                "com.fasterxml.jackson.."
            );

    @ArchTest
    static final ArchRule controllersInApi =
        classes().that().areAnnotatedWith("org.springframework.web.bind.annotation.RestController")
            .should().resideInAPackage("..api..");

    @ArchTest
    static final ArchRule noJavaxImports =
        noClasses().should().dependOnClassesThat().resideInAPackage("javax..");

    @ArchTest
    static final ArchRule noRestTemplate =
        noClasses().should().dependOnClassesThat()
            .haveFullyQualifiedName("org.springframework.web.client.RestTemplate");

    @ArchTest
    static final ArchRule onlyOneRestControllerAdvice =
        classes().that().areAnnotatedWith("org.springframework.web.bind.annotation.RestControllerAdvice")
            .should().resideOutsideOfPackage("<<org>>.<<service_name>>..")
            .as("Generic @RestControllerAdvice is provided by <<org>>-common-error-handling. " +
                "Service-local advice is forbidden.");
}
